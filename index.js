const express = require("express");

const dotenv = require('dotenv');
dotenv.config();

const session = require('express-session');

const flash = require('connect-flash');

const cookieParser = require('cookie-parser');

const app = express();

const path = require("path");

const PORT = process.env.PORT || 3000;

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.ENDPOINT_SECRET;

const adminRoute = require("./routes/admin");

// const FormData = require('form-data');

app.set("view engine", "ejs");
app.set("views", 'views');

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

// Session middleware
app.use(session({
  secret: 'jefjwegj@!*&%^*%(1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

// Flash middleware
app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.session.name = req.cookies._prod_email || '';
  next();
})

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Match the raw body to content type application/json
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  let session = '';
  let customerId = '';

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  }
  catch (err) {
    // console.log("first", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // console.log(event.type);

  // Handle the event
  switch (event.type) {  
    case 'checkout.session.async_payment_failed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('failed...');
      	break;
    case 'checkout.session.async_payment_succeeded':
      	session = event.data.object;
      	// console.log('PaymentMethod was attached to a Customer!');
      	console.log('succeed');
      	break;
    	// ... handle other event types
    case 'checkout.session.completed':
        session = event.data.object;
        customerId = session.customer;
    	  console.log(`completed ${customerId}`);
        break;
    case 'checkout.session.expired':
        session = event.data.object;
        console.log('expired');
        break;
      
    case 'customer.bank_account.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer bank_account created...');
      	break;
    case 'customer.bank_account.deleted':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer bank_account deleted...');
      	break;
    case 'customer.bank_account.updated':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer bank_account updated...');
      	break;
    case 'customer.card.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer card created...');
      	break;
    case 'customer.card.deleted':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer card deleted...');
      	break;
    case 'customer.card.updated':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer card updated...');
      	break;
    case 'customer.subscription.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer subscription created...');
      	break;
    case 'customer.subscription.deleted':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer subscription deleted...');
      	break;
    case 'customer.subscription.paused':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer subscription paused...');
      	break;
    case 'customer.subscription.resumed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer subscription resumed...');
      	break;
    case 'customer.subscription.trial_will_end':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer subscription trial_will_end...');
      	break;
    case 'customer.subscription.updated':
      	session = event.data.object;
        customerId = session.customer;
      	// console.log('PaymentIntent was successful!');
        console.log(`Customer subscription updated... Customer ID: ${customerId}`);
      	break;
    case 'invoice.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer invoice created...');
      	break;
    case 'invoice.finalization_failed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer invoice finalization_failed...');
      	break;
    case 'invoice.payment_failed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer invoice payment_failed...');
      	break;
    case 'invoice.payment_succeeded':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer invoice payment_succeeded...');
      	break;
    case 'invoice.sent':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer invoice sent...');
      	break;
    case 'payment_intent.amount_capturable_updated':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent amount_capturable_updated...');
      	break;
    case 'payment_intent.canceled':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent canceled...');
      	break;
    case 'payment_intent.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent created...');
      	break;
    case 'payment_intent.partially_funded':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent partially_funded...');
      	break;
    case 'payment_intent.payment_failed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent payment_failed...');
      	break;
    case 'payment_intent.processing':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent processing...');
      	break;
    case 'payment_intent.requires_action':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent requires_action...');
      	break;
    case 'payment_intent.succeeded':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payment_intent succeeded...');
      	break;
    case 'payout.canceled':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout canceled...');
      	break;
    case 'payout.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout created...');
      	break;
    case 'payout.failed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout failed...');
      	break;
    case 'payout.paid':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout paid...');
      	break;
    case 'payout.reconciliation_completed':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout reconciliation_completed...');
      	break;
    case 'payout.updated':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer payout updated...');
      	break;
    case 'billing.alert.triggered':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer billing alert triggered...');
      	break;
    case 'billing_portal.configuration.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer billing_portal configuration created...');
      	break;
    case 'billing_portal.configuration.updated':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer billing_portal configuration updated...');
      	break;
    case 'billing_portal.session.created':
      	session = event.data.object;
      	// console.log('PaymentIntent was successful!');
        console.log('Customer billing_portal session created...');
      	break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return res.json({ success: true });
});

app.use(adminRoute);

app.use('/', (req, res, next) => {
  return res.redirect("/login");
});

app.use('*', (req, res, next) => {
  return res.redirect("/login");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
})