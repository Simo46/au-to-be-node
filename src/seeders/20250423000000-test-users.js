'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crea un tenant di test se non esiste
    const [tenant] = await queryInterface.sequelize.query(
      `INSERT INTO tenants (id, name, domain, code, active, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Tenant Test', 'test', 'TEST', true, NOW(), NOW())
       ON CONFLICT (domain) DO UPDATE SET name = 'Tenant Test', active = true
       RETURNING id`
    );
    
    const tenantId = tenant.length > 0 ? tenant[0].id : null;
    
    if (!tenantId) {
      throw new Error('Impossibile creare il tenant di test');
    }
    
    // Crea un utente di test
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await queryInterface.bulkInsert('users', [{
      id: Sequelize.literal('gen_random_uuid()'),
      tenant_id: tenantId,
      name: 'Utente Test',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
    
    // Crea un ruolo admin se non esiste
    const [adminRole] = await queryInterface.sequelize.query(
      `INSERT INTO roles (id, name, description, created_at, updated_at)
       VALUES (gen_random_uuid(), 'admin', 'Amministratore del sistema', NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET description = 'Amministratore del sistema'
       RETURNING id`
    );
    
    const adminRoleId = adminRole.length > 0 ? adminRole[0].id : null;
    
    if (adminRoleId) {
      // Trova l'utente di test
      const [testUser] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      
      const testUserId = testUser.length > 0 ? testUser[0].id : null;
      
      if (testUserId) {
        // Associa il ruolo admin all'utente di test
        await queryInterface.bulkInsert('user_roles', [{
          id: Sequelize.literal('gen_random_uuid()'),
          user_id: testUserId,
          role_id: adminRoleId,
          created_at: new Date(),
          updated_at: new Date()
        }], {
          ignoreDuplicates: true
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Trova l'utente di test
    const [testUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
    );
    
    const testUserId = testUser.length > 0 ? testUser[0].id : null;
    
    if (testUserId) {
      // Rimuovi le associazioni utente-ruolo
      await queryInterface.bulkDelete('user_roles', { user_id: testUserId });
      
      // Rimuovi l'utente di test
      await queryInterface.bulkDelete('users', { id: testUserId });
    }
    
    // Non rimuoviamo il tenant e i ruoli per sicurezza
  }
};