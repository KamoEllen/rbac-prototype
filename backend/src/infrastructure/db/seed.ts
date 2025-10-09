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
  console.log(' Seeding database...\n');

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

    console.log(` Created teams:`);
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
      description: 'Can manage vault secrets',
      permissions: {
        vault: ['create', 'read', 'update', 'delete'],
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
        reporting: ['read'],
      },
    }).returning();

    const [reportingEditorRole] = await db.insert(roles).values({
      name: 'Reporting Editor',
      description: 'Can create and edit reports',
      permissions: {
        vault: [],
        financials: [],
        reporting: ['create', 'read', 'update', 'delete'],
      },
    }).returning();

    if (!adminRole || !vaultEditorRole || !financeViewerRole || !reportingEditorRole) {
      throw new Error('Failed to create roles');
    }

    console.log(` Created roles:`);
    console.log(`   - ${adminRole.name} (${adminRole.id})`);
    console.log(`   - ${vaultEditorRole.name} (${vaultEditorRole.id})`);
    console.log(`   - ${financeViewerRole.name} (${financeViewerRole.id})`);
    console.log(`   - ${reportingEditorRole.name} (${reportingEditorRole.id})\n`);

    console.log('Creating groups...');
    
    const [engineeringAdminsGroup] = await db.insert(groups).values({
      name: 'Engineering Admins',
      description: 'Full access for engineering team',
      teamId: engineeringTeam.id,
    }).returning();

    const [financeViewersGroup] = await db.insert(groups).values({
      name: 'Finance Viewers',
      description: 'Read-only access for finance team',
      teamId: financeTeam.id,
    }).returning();

    if (!engineeringAdminsGroup || !financeViewersGroup) {
      throw new Error('Failed to create groups');
    }

    console.log(`Created groups:`);
    console.log(`   - ${engineeringAdminsGroup.name} (${engineeringAdminsGroup.id})`);
    console.log(`   - ${financeViewersGroup.name} (${financeViewersGroup.id})\n`);

    console.log('Linking groups to roles...');
    
    await db.insert(groupRoles).values([
      {
        groupId: engineeringAdminsGroup.id,
        roleId: adminRole.id,
      },
      {
        groupId: financeViewersGroup.id,
        roleId: financeViewerRole.id,
      },
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

    const [financeUser] = await db.insert(users).values({
      email: 'finance@acme.com',
      name: 'Finance User',
      verified: true,
      tenantId: tenant.id,
      teamId: financeTeam.id,
    }).returning();

    const [pendingUser] = await db.insert(users).values({
      email: 'pending@acme.com',
      name: 'Pending User',
      verified: false,
      tenantId: tenant.id,
      teamId: engineeringTeam.id,
    }).returning();

    if (!adminUser || !financeUser || !pendingUser) {
      throw new Error('Failed to create users');
    }

    console.log(`Created users:`);
    console.log(`   - ${adminUser.name} (${adminUser.email}) - VERIFIED`);
    console.log(`   - ${financeUser.name} (${financeUser.email}) - VERIFIED`);
    console.log(`   - ${pendingUser.name} (${pendingUser.email}) - NOT VERIFIED\n`);

    console.log('Linking users to groups...');
    
    await db.insert(userGroups).values([
      {
        userId: adminUser.id,
        groupId: engineeringAdminsGroup.id,
      },
      {
        userId: financeUser.id,
        groupId: financeViewersGroup.id,
      },
    ]);

    console.log(`Linked users to groups\n`);

    console.log('Seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`   - 1 Tenant`);
    console.log(`   - 2 Teams`);
    console.log(`   - 4 Roles`);
    console.log(`   - 2 Groups`);
    console.log(`   - 3 Users (2 verified, 1 pending)\n`);
    
    console.log(' Test Accounts:');
    console.log(`   - admin@acme.com    (Full access to Engineering team)`);
    console.log(`   - finance@acme.com  (Read-only to Finance team)`);
    console.log(`   - pending@acme.com  (Unverified, cannot login)\n`);

    console.log('Next steps:');
    console.log(`   1. Run: bun run dev`);
    console.log(`   2. Test login with: admin@acme.com`);
    console.log(`   3. Open Drizzle Studio: bun run db:studio\n`);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();