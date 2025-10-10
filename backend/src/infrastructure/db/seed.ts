import { db } from './client';
import { 
  tenants, 
  teams, 
  users, 
  roles, 
  groups, 
  userGroups, 
  groupRoles 
} from './schema';

async function seed() {
  console.log('Seeding database...\n');

  try {
    console.log('Creating tenant...');
    const [tenant] = await db.insert(tenants).values({
      name: 'Acme Corporation',
    }).returning();

    if (!tenant) throw new Error('Failed to create tenant');
    console.log(`Created tenant: ${tenant.name} (${tenant.id})\n`);

    console.log('Creating teams...');
    const [engineeringTeam] = await db.insert(teams).values({
      name: 'Engineering',
      tenantId: tenant.id,
    }).returning();

    const [financeTeam] = await db.insert(teams).values({
      name: 'Finance',
      tenantId: tenant.id,
    }).returning();

    if (!engineeringTeam || !financeTeam) {
      throw new Error('Failed to create teams');
    }

    console.log(`Created teams:`);
    console.log(`   - ${engineeringTeam.name} (${engineeringTeam.id})`);
    console.log(`   - ${financeTeam.name} (${financeTeam.id})\n`);

    console.log('Creating roles...');
    
    const [adminRole] = await db.insert(roles).values({
      name: 'Admin',
      description: 'Full access to all modules',
      permissions: {
        vault: ['create', 'read', 'update', 'delete'],
        financials: ['create', 'read', 'update', 'delete'],
        reporting: ['create', 'read', 'update', 'delete'],
      },
    }).returning();

    const [vaultEditorRole] = await db.insert(roles).values({
      name: 'Vault Editor',
      description: 'Can create, read, and update vault secrets (no delete)',
      permissions: {
        vault: ['create', 'read', 'update'],
        financials: [],
        reporting: [],
      },
    }).returning();

    const [vaultViewerRole] = await db.insert(roles).values({
      name: 'Vault Viewer',
      description: 'Read-only access to vault',
      permissions: {
        vault: ['read'],
        financials: [],
        reporting: [],
      },
    }).returning();

    const [financeViewerRole] = await db.insert(roles).values({
      name: 'Finance Viewer',
      description: 'Read-only access to financials',
      permissions: {
        vault: [],
        financials: ['read'],
        reporting: [],
      },
    }).returning();

    const [financeEditorRole] = await db.insert(roles).values({
      name: 'Finance Editor',
      description: 'Full access to financials',
      permissions: {
        vault: [],
        financials: ['create', 'read', 'update', 'delete'],
        reporting: [],
      },
    }).returning();

    const [reportingEditorRole] = await db.insert(roles).values({
      name: 'Reporting Editor',
      description: 'Can create and edit reports (no delete)',
      permissions: {
        vault: [],
        financials: [],
        reporting: ['create', 'read', 'update'],
      },
    }).returning();

    if (!adminRole || !vaultEditorRole || !vaultViewerRole || 
        !financeViewerRole || !financeEditorRole || !reportingEditorRole) {
      throw new Error('Failed to create roles');
    }

    console.log(`Created roles:`);
    console.log(`   - ${adminRole.name}`);
    console.log(`   - ${vaultEditorRole.name}`);
    console.log(`   - ${vaultViewerRole.name}`);
    console.log(`   - ${financeViewerRole.name}`);
    console.log(`   - ${financeEditorRole.name}`);
    console.log(`   - ${reportingEditorRole.name}\n`);

    console.log('Creating groups...');
    
    const [engineeringAdminsGroup] = await db.insert(groups).values({
      name: 'Engineering Admins',
      description: 'Full system administrators',
      teamId: engineeringTeam.id,
    }).returning();

    const [vaultOpsGroup] = await db.insert(groups).values({
      name: 'Vault Operations',
      description: 'Manages vault secrets (no delete)',
      teamId: engineeringTeam.id,
    }).returning();

    const [vaultReadOnlyGroup] = await db.insert(groups).values({
      name: 'Vault Read Only',
      description: 'Read-only vault access',
      teamId: engineeringTeam.id,
    }).returning();

    const [financeViewersGroup] = await db.insert(groups).values({
      name: 'Finance Viewers',
      description: 'Read-only access to financial data',
      teamId: financeTeam.id,
    }).returning();

    const [financeManagersGroup] = await db.insert(groups).values({
      name: 'Finance Managers',
      description: 'Full access to financials and reporting',
      teamId: financeTeam.id,
    }).returning();

    if (!engineeringAdminsGroup || !vaultOpsGroup || !vaultReadOnlyGroup || 
        !financeViewersGroup || !financeManagersGroup) {
      throw new Error('Failed to create groups');
    }

    console.log(`Created groups:`);
    console.log(`   - ${engineeringAdminsGroup.name} (Engineering)`);
    console.log(`   - ${vaultOpsGroup.name} (Engineering)`);
    console.log(`   - ${vaultReadOnlyGroup.name} (Engineering)`);
    console.log(`   - ${financeViewersGroup.name} (Finance)`);
    console.log(`   - ${financeManagersGroup.name} (Finance)\n`);

    console.log('Linking groups to roles...');
    
    await db.insert(groupRoles).values([
      { groupId: engineeringAdminsGroup.id, roleId: adminRole.id },
      { groupId: vaultOpsGroup.id, roleId: vaultEditorRole.id },
      { groupId: vaultReadOnlyGroup.id, roleId: vaultViewerRole.id },
      { groupId: financeViewersGroup.id, roleId: financeViewerRole.id },
      { groupId: financeManagersGroup.id, roleId: financeEditorRole.id },
      { groupId: financeManagersGroup.id, roleId: reportingEditorRole.id },
    ]);

    console.log(`Linked groups to roles\n`);

    console.log('Creating users...');
    
    const [adminUser] = await db.insert(users).values({
      email: 'admin@acme.com',
      name: 'Admin User',
      verified: true,
      tenantId: tenant.id,
      teamId: engineeringTeam.id,
    }).returning();

    const [vaultUser] = await db.insert(users).values({
      email: 'vault@acme.com',
      name: 'Vault Operator',
      verified: true,
      tenantId: tenant.id,
      teamId: engineeringTeam.id,
    }).returning();

    const [financeViewerUser] = await db.insert(users).values({
      email: 'viewer@acme.com',
      name: 'Finance Viewer',
      verified: true,
      tenantId: tenant.id,
      teamId: financeTeam.id,
    }).returning();

    const [financeManagerUser] = await db.insert(users).values({
      email: 'manager@acme.com',
      name: 'Finance Manager',
      verified: true,
      tenantId: tenant.id,
      teamId: financeTeam.id,
    }).returning();

    const [readOnlyUser] = await db.insert(users).values({
      email: 'readonly@acme.com',
      name: 'Read Only User',
      verified: true,
      tenantId: tenant.id,
      teamId: engineeringTeam.id,
    }).returning();

    const [pendingUser] = await db.insert(users).values({
      email: 'pending@acme.com',
      name: 'Pending User',
      verified: false,
      tenantId: tenant.id,
      teamId: engineeringTeam.id,
    }).returning();

    if (!adminUser || !vaultUser || !financeViewerUser || 
        !financeManagerUser || !readOnlyUser || !pendingUser) {
      throw new Error('Failed to create users');
    }

    console.log(`Created users:`);
    console.log(`   - ${adminUser.name} (${adminUser.email}) - VERIFIED`);
    console.log(`   - ${vaultUser.name} (${vaultUser.email}) - VERIFIED`);
    console.log(`   - ${financeViewerUser.name} (${financeViewerUser.email}) - VERIFIED`);
    console.log(`   - ${financeManagerUser.name} (${financeManagerUser.email}) - VERIFIED`);
    console.log(`   - ${readOnlyUser.name} (${readOnlyUser.email}) - VERIFIED`);
    console.log(`   - ${pendingUser.name} (${pendingUser.email}) - NOT VERIFIED\n`);

    console.log('Linking users to groups...');
    
    await db.insert(userGroups).values([
      { userId: adminUser.id, groupId: engineeringAdminsGroup.id },
      { userId: vaultUser.id, groupId: vaultOpsGroup.id },
      { userId: financeViewerUser.id, groupId: financeViewersGroup.id },
      { userId: financeManagerUser.id, groupId: financeManagersGroup.id },
      { userId: readOnlyUser.id, groupId: vaultReadOnlyGroup.id },
    ]);

    console.log(`Linked users to groups\n`);

    console.log('Seeding completed successfully!\n');
    
    console.log('='.repeat(70));
    console.log('DATABASE SUMMARY');
    console.log('='.repeat(70));
    console.log(`Tenant:  ${tenant.name}`);
    console.log(`Teams:   2 (Engineering, Finance)`);
    console.log(`Roles:   6 (Admin, Vault Editor, Vault Viewer, etc.)`);
    console.log(`Groups:  5 (Engineering Admins, Vault Ops, etc.)`);
    console.log(`Users:   6 (5 verified, 1 pending)`);
    console.log('='.repeat(70));
    console.log('\n');

    console.log('='.repeat(70));
    console.log('TEST CREDENTIALS & PERMISSIONS');
    console.log('='.repeat(70));
    console.log('1. admin@acme.com');
    console.log('   - Full access to ALL modules (Vault, Financials, Reporting)');
    console.log('   - Team: Engineering\n');
    
    console.log('2. vault@acme.com');
    console.log('   - Vault: Create, Read, Update (NO DELETE)');
    console.log('   - Financials: No access');
    console.log('   - Reporting: No access');
    console.log('   - Team: Engineering\n');
    
    console.log('3. viewer@acme.com');
    console.log('   - Vault: No access');
    console.log('   - Financials: Read only');
    console.log('   - Reporting: No access');
    console.log('   - Team: Finance\n');
    
    console.log('4. manager@acme.com');
    console.log('   - Vault: No access');
    console.log('   - Financials: Full CRUD');
    console.log('   - Reporting: Create, Read, Update (NO DELETE)');
    console.log('   - Team: Finance\n');
    
    console.log('5. readonly@acme.com');
    console.log('   - Vault: Read only');
    console.log('   - Financials: No access');
    console.log('   - Reporting: No access');
    console.log('   - Team: Engineering\n');
    
    console.log('6. pending@acme.com');
    console.log('   - CANNOT LOGIN (awaiting verification)');
    console.log('   - Team: Engineering\n');
    console.log('='.repeat(70));
    console.log('\n');

    console.log('='.repeat(70));
    console.log('NEXT STEPS');
    console.log('='.repeat(70));
    console.log('1. Start backend:  bun run dev');
    console.log('2. Start frontend: cd ../frontend && npm run dev');
    console.log('3. Test login:     http://localhost:5173');
    console.log('4. View database:  bun run db:studio');
    console.log('='.repeat(70));
    console.log('\n');

    console.log('TIP: Login with different users to see how permissions work!');
    console.log('   - Each user has different access levels');
    console.log('   - Navigation items hide based on permissions');
    console.log('   - Action buttons (create/edit/delete) appear based on roles\n');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
