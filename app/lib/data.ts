// import { sql } from "@vercel/postgres";
import {
	CustomerField,
	CustomersTableType,
	InvoiceForm,
	InvoicesTable,
	LatestInvoiceRaw,
	Revenue,
} from "./definitions";
import clientPromise from "./mongodb";

import { formatCurrency } from "./utils";

export async function fetchRevenue() {
	try {
		const client = await clientPromise;
		const collection = client
			.db("nextjs-dashboard-tutorial")
			.collection("revenue");

		await new Promise((resolve) => setTimeout(resolve, 4000))
		const data = await collection.find({}).toArray();
		return data;
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch revenue data.");
	}
}

export async function fetchLatestInvoices() {
	try {
		const client = await clientPromise;
		const collection = client
			.db("nextjs-dashboard-tutorial")
			.collection("invoices");
		// const data = await collection.find({},{limit:5, sort: {_id: -1}}).toArray()

		
		const data = await collection
			.aggregate([
				{ $sort: { date: -1 } },
				{ $limit: 5 },
				{
					$lookup: {
						from: "customers",
						localField: "customer_id",
						foreignField: "_id",
						as: "customer_info",
					},
				},
				{ $unwind: "$customer_info" },
				{
					$project: {
						amount: 1,
						name: "$customer_info.name",
						email: "$customer_info.email",
						image_url: "$customer_info.image_url",
					},
				},
			])
			.toArray();
		await new Promise((resolve) => setTimeout(resolve, 3000))
		const latestInvoices = data.map((invoice) => ({
			...invoice,
			amount: formatCurrency(invoice.amount),
		}));
		return latestInvoices;
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch the latest invoices.");
	}
}

export async function fetchCardData() {
	try {
		// You can probably combine these into a single SQL query
		// However, we are intentionally splitting them to demonstrate
		// how to initialize multiple queries in parallel with JS.
		const client = await clientPromise;
		const collection = {
			invoices: client.db("nextjs-dashboard-tutorial").collection("invoices"),
			customers: client.db("nextjs-dashboard-tutorial").collection("customers"),
		};

		const invoiceCountPromise = collection.invoices.countDocuments();
		const customerCountPromise = collection.customers.countDocuments();
		const invoiceStatusPromise = collection.invoices
			.aggregate([
				{
					$group: {
						_id: null,
						paid: {
							$sum: {
								$cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
							},
						},
						pending: {
							$sum: {
								$cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
							},
						},
					},
				},
			])
			.toArray();
		const [numberOfInvoices, numberOfCustomers, sumInvoiceValues] =
			await Promise.all([
				invoiceCountPromise,
				customerCountPromise,
				invoiceStatusPromise,
			]);

		const totalPaidInvoices = sumInvoiceValues[0].paid ?? "0";
		const totalPendingInvoices = sumInvoiceValues[0].pending ?? "0";

		return {
			numberOfCustomers,
			numberOfInvoices,
			totalPaidInvoices,
			totalPendingInvoices,
		};
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch card data.");
	}
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
	query: string,
	currentPage: number
) {
	const client = await clientPromise;
	const db = client.db('nextjs-dashboard-tutorial')
	const collection = { 
		invoices: db.collection("invoices"),
		customers: db.collection("customers"),
	}
	const offset = (currentPage - 1) * ITEMS_PER_PAGE;

	const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 

	try {
		const invoices = collection.invoices.aggregate([
			{
				$lookup: {
					from: "customers",
					localField: "customer_id",
					foreignField: "_id",
					as: "customer"
				}
			},
			{
				$unwind: "$customer"
			},
			{
				$match: { 
					$or: [
						{"customer.name": {$regex: safeQuery, $options: "i"}},
						{"customer.email": {$regex: safeQuery, $options: "i"}},
						{"amount": {$regex: safeQuery, $options: "i"}},
						{"date": {$regex: safeQuery, $options: "i"}},
						{"status": {$regex: safeQuery, $options: "i"}},
					]
				}
			},
			{
				$sort: {"date": -1}
			},
			{
				$skip: offset
			},
			{
				$limit: ITEMS_PER_PAGE
			},
			{ 
				$project: { 
					amount: 1, 
					date: 1, 
					status: 1, 
					"customer.name": 1,
					"customer.email": 1,
					"customer.image_url": 1
				}
			}
		])
		return invoices.toArray();
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch invoices.");
	}
}

export async function fetchInvoicesPages(query: string) {
	try {
		const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

		const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
		return totalPages;
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch total number of invoices.");
	}
}

export async function fetchInvoiceById(id: string) {
	try {
		const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

		const invoice = data.rows.map((invoice) => ({
			...invoice,
			// Convert amount from cents to dollars
			amount: invoice.amount / 100,
		}));

		return invoice[0];
	} catch (error) {
		console.error("Database Error:", error);
		throw new Error("Failed to fetch invoice.");
	}
}

export async function fetchCustomers() {
	try {
		const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

		const customers = data.rows;
		return customers;
	} catch (err) {
		console.error("Database Error:", err);
		throw new Error("Failed to fetch all customers.");
	}
}

export async function fetchFilteredCustomers(query: string) {
	try {
		const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

		const customers = data.rows.map((customer) => ({
			...customer,
			total_pending: formatCurrency(customer.total_pending),
			total_paid: formatCurrency(customer.total_paid),
		}));

		return customers;
	} catch (err) {
		console.error("Database Error:", err);
		throw new Error("Failed to fetch customer table.");
	}
}
