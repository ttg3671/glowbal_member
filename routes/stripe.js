const stripe = require('stripe');

const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: '2020-08-27'
});

const checkoutSession = async (customerID) => {
	const sessions = await Stripe.checkout.sessions.list({
		customer: customerID,
	});

	return sessions;
}

const addNewCustomer = async (email) => {
	const customer = await Stripe.customers.create({
		email: email,
		description: 'New Customer'
	}) 

	return customer;
}

const getCustomerByID = async (id) => {
	const customer = await Stripe.customers.retrieve(id); 
	return customer;
}

// const createCheckoutSession = async (customer, price) => {
//   const session = await Stripe.checkout.sessions.create({
//     mode: "subscription",
//     payment_method_types: ["card"],
//     customer,
//     line_items: [
//       {
//         price,
//         quantity: 1,
//       },
//     ],
//     success_url: `http://localhost:3000/v1/success`, // => http://localhost:3000
// 		cancel_url: 'http://localhost:3000' + '/v1/cancel'
//   });

//   return session;
// };

const retrieveSubscription = async (sub_id) => {
	const session = await Stripe.subscriptions.retrieve(sub_id);

	return session;
}

const updateSubscription = async (sub_id, plan_id) => {
	const session = await Stripe.subscriptions.update(
		sub_id,
		{
			metadata: {
				order_id: plan_id
			}
		}
	);

	return session;
}

const listSubscription = async () => {
	const subscriptions = await Stripe.subscriptions.list({
		status: 'active'
	})

	return subscriptions;
}

const cancelSubscription = async (sub_id) => {
	const session = await Stripe.subscriptions.del(sub_id);

	return session;
}

module.exports = {
	checkoutSession,
	addNewCustomer,
	getCustomerByID,
	// createCheckoutSession,
	retrieveSubscription,
	updateSubscription,
	cancelSubscription,
	listSubscription
}