import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/database.config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../types/user-role.enum';

async function createSuperAdmin() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  console.log('🔧 Creating new Super Admin...');

  // Check for required environment variables
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.error('❌ ERROR: Missing required environment variables:');
    if (!superAdminEmail) console.error('   - SUPER_ADMIN_EMAIL');
    if (!superAdminPassword) console.error('   - SUPER_ADMIN_PASSWORD');
    console.error('\n💡 Please set these in your .env file or environment.\n');
    await dataSource.destroy();
    process.exit(1);
  }

  const userRepository = dataSource.getRepository(User);

  // Remove old seeded admin if exists
  const oldAdmin = await userRepository.findOne({
    where: { email: 'admin@237dollars.com' },
  });

  if (oldAdmin) {
    await userRepository.remove(oldAdmin);
    console.log('✅ Removed old seeded admin (admin@237dollars.com)');
  }

  // Check if super admin already exists
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: superAdminEmail },
  });

  if (existingSuperAdmin) {
    console.log('ℹ️  Super Admin already exists');
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
  const superAdmin = userRepository.create({
    email: superAdminEmail,
    username: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin',
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    emailVerified: true, // Skip email verification for admin
  });

  await userRepository.save(superAdmin);
  console.log('\n✅ Super Admin Created Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email: ' + superAdminEmail);
  console.log('🔑 Password: ********** (hidden for security)');
  console.log('👤 Username: superadmin');
  console.log('🛡️  Role: SUPER_ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await dataSource.destroy();
}

createSuperAdmin()
  .then(() => {
    console.log('✨ Super Admin setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  });
