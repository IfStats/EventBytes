import {
  PrismaClient,
  OrganizationRole,
  PaymentProvider,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {

  console.log("Seeding database...");


  // Countries
  await prisma.country.createMany({
    data: [
      {
        code: "NG",
        name: "Nigeria",
        currency: "NGN",
        symbol: "₦",
        locale: "en-NG",
        timezone: "Africa/Lagos",
        phoneCode: "+234",
        paymentProvider: PaymentProvider.PAYSTACK,
      },
      {
        code: "GH",
        name: "Ghana",
        currency: "GHS",
        symbol: "₵",
        locale: "en-GH",
        timezone: "Africa/Accra",
        phoneCode: "+233",
        paymentProvider: PaymentProvider.PAYSTACK,
      },
    ],
    skipDuplicates:true,
  });


  // Organization
  const organization =
    await prisma.organization.upsert({
      where:{
        slug:"eventbytes",
      },
      update:{},
      create:{
        name:"EventBytes",
        slug:"eventbytes",
        countryCode:"GH",
      },
    });


  // User
  const passwordHash =
    await argon2.hash(
      "Password123!"
    );


  const user =
    await prisma.user.upsert({
      where:{
        email:"admin@eventbytes.com",
      },
      update:{
        passwordHash,
      },
      create:{
        email:"admin@eventbytes.com",
        passwordHash,
        firstName:"Joshua",
        lastName:"Akunna",
        isVerified:true,
      },
    });


  // Membership
  await prisma.membership.upsert({
    where:{
      userId_organizationId:{
        userId:user.id,
        organizationId:organization.id,
      },
    },
    update:{},
    create:{
      userId:user.id,
      organizationId:organization.id,
      role:OrganizationRole.OWNER,
    },
  });


  // Event
  const event =
    await prisma.event.upsert({
      where:{
        slug:"eventbytes-launch",
      },
      update:{},
      create:{
        organizationId:organization.id,
        name:"EventBytes Launch Conference",
        slug:"eventbytes-launch",
        description:"Official EventBytes launch event",
        venue:"Accra International Conference Centre",
        startDate:new Date("2026-12-01T09:00:00Z"),
        endDate:new Date("2026-12-01T18:00:00Z"),
        capacity:500,
      },
    });


  // Tickets
  await prisma.ticketCategory.deleteMany({
    where:{
      eventId:event.id,
    },
  });


  await prisma.ticketCategory.createMany({
    data:[
      {
        eventId:event.id,
        name:"Early Bird",
        price:100,
        quantity:100,
      },
      {
        eventId:event.id,
        name:"Regular",
        price:200,
        quantity:300,
      },
      {
        eventId:event.id,
        name:"VIP",
        price:500,
        quantity:100,
      },
    ],
  });


  console.log("Database seeded successfully");
}


main()
.catch(console.error)
.finally(async()=>{
 await prisma.$disconnect();
});