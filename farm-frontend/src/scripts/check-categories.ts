import { prisma } from '../lib/prisma'

async function main() {
  const categories = await prisma.category.findMany({ take: 20 })
  console.log('Categories in database:', categories.length)

  if (categories.length > 0) {
    console.log('\nSample categories:')
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`)
    })
  } else {
    console.log('No categories found - need to seed!')
  }

  await prisma.$disconnect()
}

main()
