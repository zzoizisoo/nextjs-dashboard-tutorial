import bcrypt from "bcrypt";
// import mongodb from "@/app/lib/db";

// import { invoices, customers, revenue, users } from "../lib/placeholder-data";

// async function seedUsers() {
// 	const insertedUsers = await Promise.all(users.map(async user => {
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     return mongodb.usersCollection.insertOne({
// 			name: user.name,
// 			email: user.email,
// 			password: hashedPassword,
// 		})
//   }))
// 	return insertedUsers;
// }

// async function seedCustomers() {
// 	const insertedCustomers = await mongodb.customersCollection.insertMany(
// 		customers
// 	);
// 	return insertedCustomers;
// }

// async function seedInvoices() {
//   const insertedInvoices = await mongodb.invoicesCollection.insertMany(invoices)
// 	return insertedInvoices;
// }

// async function seedRevenue() {
// 	const insertedRevenue = await mongodb.revenueCollection.insertMany(revenue);
// 	return insertedRevenue;
// }

// export async function GET() {
// 	try {
// 		// await seedUsers();
// 		// await seedCustomers();
// 		// await seedInvoices();
// 		// await seedRevenue();
// 		return Response.json({ message: "Database seeded successfully" });
// 	} catch (e) {
// 		console.error(e);
// 		return Response.json({ e }, { status: 500 });
// 	}
// }
