import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/database.config';
import { Major } from '../entities/major.entity';
import { Topic } from '../entities/topic.entity';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../types/user-role.enum';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  console.log('🌱 Seeding database...');

  const majorRepository = dataSource.getRepository(Major);
  const topicRepository = dataSource.getRepository(Topic);
  const userRepository = dataSource.getRepository(User);

  // Create Super Admin user
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@237dollars.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@237dollars', 12);
    const superAdmin = userRepository.create({
      email: 'admin@237dollars.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true, // Skip email verification for seeded admin
    });
    await userRepository.save(superAdmin);
    console.log('✅ Super Admin created: admin@237dollars.com / Admin@237dollars');
  } else {
    console.log('ℹ️  Super Admin already exists');
  }

  // Seed Majors and Topics
  const majorsData = [
    {
      name: 'Korean',
      description: 'Learn Korean language from basics to advanced',
      displayOrder: 1,
      topics: [
        { name: 'Reading', description: 'Korean reading skills', displayOrder: 1 },
        { name: 'Writing', description: 'Korean writing skills', displayOrder: 2 },
        { name: 'Level 1 Grammar', description: 'Beginner Korean grammar', displayOrder: 3 },
        { name: 'Level 2 Grammar', description: 'Elementary Korean grammar', displayOrder: 4 },
        { name: 'Level 3 Grammar', description: 'Intermediate Korean grammar', displayOrder: 5 },
        { name: 'Level 4 Grammar', description: 'Upper-intermediate Korean grammar', displayOrder: 6 },
        { name: 'Level 5 Grammar', description: 'Advanced Korean grammar', displayOrder: 7 },
        { name: 'Level 6 Grammar', description: 'Expert Korean grammar', displayOrder: 8 },
      ],
    },
    {
      name: 'English',
      description: 'Master English language skills',
      displayOrder: 2,
      topics: [
        { name: 'Beginner', description: 'Basic English for beginners', displayOrder: 1 },
        { name: 'Intermediate', description: 'Intermediate English skills', displayOrder: 2 },
        { name: 'Advanced', description: 'Advanced English proficiency', displayOrder: 3 },
        { name: 'IELTS', description: 'IELTS test preparation', displayOrder: 4 },
      ],
    },
    {
      name: 'Coding',
      description: 'Learn programming and web development',
      displayOrder: 3,
      topics: [
        { name: 'Frontend Basic > HTML', description: 'HTML fundamentals', displayOrder: 1 },
        { name: 'Frontend Basic > CSS', description: 'CSS fundamentals', displayOrder: 2 },
        { name: 'Frontend Basic > JavaScript', description: 'JavaScript basics', displayOrder: 3 },
        { name: 'Frontend Advanced > HTML', description: 'Advanced HTML', displayOrder: 4 },
        { name: 'Frontend Advanced > CSS', description: 'Advanced CSS', displayOrder: 5 },
        { name: 'Frontend Advanced > JavaScript', description: 'Advanced JavaScript', displayOrder: 6 },
        { name: 'Frontend Advanced > TypeScript', description: 'TypeScript programming', displayOrder: 7 },
        { name: 'Frontend Advanced > Angular', description: 'Angular framework', displayOrder: 8 },
        { name: 'Python', description: 'Python programming', displayOrder: 9 },
        { name: 'Backend > Django', description: 'Django framework', displayOrder: 10 },
        { name: 'Backend > Node.js', description: 'Node.js runtime', displayOrder: 11 },
        { name: 'Backend > NestJS', description: 'NestJS framework', displayOrder: 12 },
      ],
    },
  ];

  for (const majorData of majorsData) {
    let major = await majorRepository.findOne({
      where: { name: majorData.name },
    });

    if (!major) {
      major = majorRepository.create({
        name: majorData.name,
        description: majorData.description,
        displayOrder: majorData.displayOrder,
      });
      await majorRepository.save(major);
      console.log(`✅ Created major: ${major.name}`);
    } else {
      console.log(`ℹ️  Major already exists: ${major.name}`);
    }

    for (const topicData of majorData.topics) {
      const existingTopic = await topicRepository.findOne({
        where: { name: topicData.name, majorId: major.id },
      });

      if (!existingTopic) {
        const topic = topicRepository.create({
          majorId: major.id,
          name: topicData.name,
          description: topicData.description,
          displayOrder: topicData.displayOrder,
        });
        await topicRepository.save(topic);
        console.log(`  ✅ Created topic: ${topic.name}`);
      } else {
        console.log(`  ℹ️  Topic already exists: ${topicData.name}`);
      }
    }
  }

  console.log('🎉 Seeding completed!');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
