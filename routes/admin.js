const express = require('express');

const axios = require('axios');

const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Stripe = require('./stripe');

const { body, validationResult } = require("express-validator");

const FormData = require("form-data");

const crypto = require("crypto");

const requestIp = require("request-ip");

const baseUrl = "https://glowbal.co.uk/api/";

const isAuth = require("../middleware/is_auth");

// Generate a random key and IV (Initialization Vector)
const algorithm = 'aes-256-cbc'; // AES encryption with CBC mode
const key = crypto.randomBytes(32); // 32 bytes = 256 bits
const iv = crypto.randomBytes(16); // 16 bytes for CBC mode

// console.log(key, iv);

// Encrypt function
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex'); // Encrypt the text
  encrypted += cipher.final('hex'); // Finish the encryption process
  return { encrypted, key, iv }; // Return encrypted data along with key and iv
}

// Decrypt function
function decrypt(encryptedData, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted; // Return the decrypted data
}

router.get("/login", async (req, res, next) => {
  try {
      let message = req.flash("error");
      // console.log(message);

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      // console.log(req.ip);
      // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

      return res.render("login", {
        title: "Login",
        errorMessage: message,
        auth: false,
        oldInput: {
          email: "",
        },
      });
  } catch (error) {
      console.log(error);
  }
})

router.get("/register", async (req, res, next) => {
  try {
      let message = req.flash("error");
      // console.log(message);

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      // console.log(req.ip);
      // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

      return res.render("register", {
        title: "Register",
        errorMessage: message,
        auth: false,
        oldInput: {
          name: "",
          email: "",
          image: ""
        },
      });
  } catch (error) {
      console.log(error);
  }
})

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
  ],
  async (req, res, next) => {
    try {
      // console.log(req.body);

      const { email, password } = req.body;

      const error = validationResult(req);
      
      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("login", {
          title: "Login",
          errorMessage: msg1,
          auth: false,
          oldInput: {
            email: email,
          },
        });
      } 
      else {
        let data = new FormData();
        data.append('email', email);
        data.append('password', password);

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: baseUrl + 'auth/login.php',
          headers: { 
            ...data.getHeaders()
          },
          data : data
        };

        const response = await axios.request(config);

        // console.log(response.data);

        if (response.data.isSuccess) {
          // const encrypted = encrypt(email);

          // console.log(encrypted.encrypted);

          return res.redirect(`/show?g=${email}`);
        }

        else {
          req.flash("Invalid email and password... Try again...");
            return res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/login");
    }
  }
);

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid user name"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
    body("cpassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const { email, password, cpassword, name, image } = req.body;

      // console.log(req.body);
      
      const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("register", {
          title: "Register",
          errorMessage: msg1,
          auth: false,
          oldInput: {
            name: name,
            email: email,
            image: image
          },
        });
      } 

      else {
        const clientIp = requestIp.getClientIp(req);

        let data = JSON.stringify({
          "email": email,
          "password": password,
          "name": name,
          "image": image,
          "ip_address": clientIp
        });

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: baseUrl + 'auth/register.php',
          headers: { 
            'Content-Type': 'application/json'
          },
          data : data
        };

        const response = await axios.request(config);

        // console.log(response.data);

        if (response.data.isSuccess) {
          // const encrypted = encrypt(email);

          return res.redirect(`/home?m=${email}`);
        }

        else {
          req.flash("error", "Try again...");
          return res.redirect("/register");
        }
      }
    } catch (error) {
      // console.log(error);
      return res.redirect("/register");
    }
  }
);

router.get("/show", async (req, res, next) => {
  try {
    const encrypted = req.query.g.trim();

    // const decrypted = decrypt(encrypted, key, iv);

    // console.log(decrypted);

    res.cookie("_prod_email", encrypted);

    const customer = await stripe.customers.list({
      email: encrypted
    })
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');

      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    }

    else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active'
      });

      // console.log(subscriptions?.data);

      if (subscriptions?.data && subscriptions?.data.length >= 1) {
        // return res.redirect("/video");
        return res.render("show", {
          title: "Show",
          isSuccess: true,
          video: "",
        })
      }

      else {
        return res.redirect("/plans")
      }
    }
  }
  catch (error) {
    console.log(error);
    return res.redirect("/plan");
  }
})

router.get("/home", async (req, res, next) => {
  try {
    const m = req.query.m || req.cookies._prod_email;
    // console.log(m);

    res.cookie("_prod_email", m);

    const customer = await stripe.customers.list({
        email: m
    })
    const customerId = customer.data[0]?.id;
    // console.log(customerId, !customerId);

    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Please register...');

      return res.redirect("/register");
    }

    else {
      return res.render("home", {
        title: "HOME",
        isSuccess: true
      })
    }
  }
  
  catch(error) {
    console.log(error);
    return res.status(500).send("Sorry there has been a issue....... Kindly refresh the page");
  }
})

router.get("/plans", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
        email: req.cookies._prod_email
    })
    const customerId = customer.data[0]?.id;
    
    // console.log(customerId, req.cookies._prod_email);
    
    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');
      
      return res.redirect(`/home?m=${req.cookies._prod_email}`);
    }
    
    else {
      const products = await stripe.products.list({
        active: true,
      }); 

      // console.log(products.data);

      const prices = await stripe.prices.list({
          active: true,
      }); 

      // console.log(prices.data);

      const plans = products.data.map((product, index) => {
          const matchingPrice = prices.data.find(price => price.id === product.default_price);
          return {
              // product_id: product.id,
            // price_id: matchingPrice.id,
            id: index+1,
              name: product?.name,
              description: product?.description,
              amount: matchingPrice?.unit_amount_decimal,
              interval: matchingPrice?.recurring.interval,
                    interval_count: matchingPrice?.recurring.interval_count
          };
      }).reverse();

      // console.log(plans);

      // const pricePromises = products.data.map(async (product) => {
      //     return await stripe.prices.retrieve(product.default_price);
      // });

      // Use Promise.all to wait for all price retrievals to complete
      // const prices = await Promise.all(pricePromises);

      // console.log(prices);

      return res.render("products", {
        title: "PLANS",
        plans
      })
    }
  }

    catch(error) {
      console.log(error);
    
      return res.redirect("/home");
    }
})

router.get("/subscribe", async (req, res, next) => {
  try {    
    const customer = await stripe.customers.list({
        email: req.cookies._prod_email
    })
    const customerId = customer.data[0]?.id;
    
    // console.log(customerId, req.cookies._prod_email);
    
    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');
      
      return res.redirect(`/?m=${req.cookies._prod_email}`);
    }
    
    else {

      const plan = req.query.plan || '';

      let priceID;

      switch (plan.toLowerCase()) {
        case 'starter':
          priceID = 'price_1QNWPs04uO8CoMBs9CkJJ6cH';
          break;
        case 'pro':
          priceID = 'price_1QNWQu04uO8CoMBsSRkcfHVJ';
          break;
        case 'premium':
          priceID = 'price_1QNWRv04uO8CoMBsatjwhSbc';
          break;
        default: 
          return res.redirect("/plans");
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [
            {
              price: priceID,
              quantity: 1,
            },
        ],
        success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`
      });

      // console.log(session);

      return res.redirect(session.url);
    }
  }

  catch(error) {
    console.log(error);
    return res.redirect("/plans");
  }
})

router.get("/success", async (req, res, next) => {
  try {
    const customer = await stripe.customers.list({
        email: req.cookies._prod_email
    })
    const customerId = customer.data[0]?.id;
    
    // console.log(customerId, req.cookies._prod_email);
    
    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');
      
      return res.redirect("/home");
    }
    
    else {
      const session_id = req.query.session_id || '';

      const session = await stripe.checkout.sessions.retrieve(
        session_id, 
        { expand: ['subscription', 'subscription.plan.product', 'invoice']}
      );

      // console.log(JSON.stringify(session.invoice));

      return res.redirect(`/show?g=${email}`);

      // return res.render("success", {
      //   title: "SUCCESS",
      //   cID: session.customer
      // })
    }
  }

  catch(error) {
    console.log(error);
    return res.redirect("/plans");
  }
})

router.get("/cancel", async (req, res, next) => {
    try {
    const customer = await stripe.customers.list({
        email: req.cookies._prod_email
    })
    const customerId = customer.data[0]?.id;
    
    // console.log(customerId, req.cookies._prod_email);
    
    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');
      
      return res.redirect("/home");
    }
    
    else {
          // return res.send("Sorry you are not subscribed...");
      return res.render("cancel", {
        title: "Failed",
      })
    }
    }

    catch(error) {
        console.log(error);
        return res.redirect("/plans");
    }
})

router.get("/customer/:customerID", async (req, res, next) => {
    try {
    const customer = await stripe.customers.list({
        email: req.cookies._prod_email
    })
    const customerId = customer.data[0]?.id;
    
    // console.log(customerId, req.cookies._prod_email);
    
    if (!customerId) {
      req.flash('error_msg', 'Customer not found! Try Again...');
      
      return res.redirect("/home");
    }
    
    else {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: req.params.customerID,
        return_url: `${process.env.BASE_URL}/subscriptions`
      })

      // console.log(portalSession);

      return res.redirect(portalSession.url);
    }
    }

    catch(error) {
        console.log(error);
    
    return res.redirect("/home");
    }
})

router.get("/subscriptions", async (req, res, next) => {
    try {
      const m = req.query.m || req.cookies._prod_email;
      // console.log(m);

      res.cookie("_prod_email", m);
      
      const customer = await stripe.customers.list({
          email: m
      })
      const customerId = customer.data[0]?.id;

      // console.log(customerId, req.cookies._prod_email);

      if (!customerId) {
        req.flash('error_msg', 'Customer not found! Try Again...');

        return res.redirect(`/home?m=${req.cookies._prod_email}`);
      }

      else {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all'
        });
        
        // console.log(subscriptions?.data.length);
        
        if (subscriptions?.data.length >= 1) {
          const subscriptionDetailsPromises = subscriptions.data.map(async (subscription) => {
            // Check if the subscription status is not 'canceled'
            if (subscription.status !== 'canceled') {
              // Process the items of the subscription if it's not canceled
              const itemDetailsPromises = subscription.items.data.map(async (item) => {
                const productId = item.plan.product;

                // Fetch the product and its associated prices concurrently
                const [product, prices] = await Promise.all([
                  stripe.products.retrieve(productId),
                  stripe.prices.list({ product: productId }) // Get all prices for the product
                ]);

                // Step 4: Find the matching price by comparing with the product's default price
                const matchingPrice = prices.data.find(price => price.id === product.default_price);

                // Step 5: Return the details for the subscription item if a match is found
                if (matchingPrice) {
                  return {
                    subscription_id: subscription.id,
                    product_name: product?.name,
                    product_description: product?.description,
                    amount: matchingPrice?.unit_amount_decimal, // Price in decimal format
                    interval: matchingPrice?.recurring?.interval, // Recurring billing interval (if applicable)
                    interval_count: matchingPrice?.recurring?.interval_count, // Interval count (if applicable)
                  };
                } else {
                  return null; // Handle case where no matching price is found
                }
              });

              // Filter out null values if no matching price is found for any item
              const validItemDetails = (await Promise.all(itemDetailsPromises)).filter(item => item !== null);

              // console.log(validItemDetails);

              return {
                subscription_id: subscription.id,
                product_name: validItemDetails[0].product_name,
                product_description: validItemDetails[0].product_description,
                amount: validItemDetails[0].amount,
                interval: validItemDetails[0].interval,
                interval_count: validItemDetails[0].interval_count
              };
            } 

            else {
              // Return null or an empty object if subscription is canceled
              return null;
            }
          });

          // Step 6: Wait for all subscription details to resolve
          const allSubscriptionDetails = (await Promise.all(subscriptionDetailsPromises)).filter(subscription => subscription !== null);

          // Flatten the array (because we have an array of arrays)
          const flatSubscriptionDetails = allSubscriptionDetails.flat();

          // console.log(flatSubscriptionDetails);

          // Step 7: Log the subscription details or process further
          // flatSubscriptionDetails.forEach(details => {
          //   console.log('Subscription Item Details:', details);
          // });
          
          if (flatSubscriptionDetails.length >= 1) {
            return res.render("subscriptions", {
              title: "SUBSCRIPTIONS",
              data: flatSubscriptionDetails
            })
          }
          else {
            return res.redirect("/plans");
          }
        }
        
        else {
          return res.redirect("/plans");
        }
      }
    }
  
    catch(error) {
          console.log(error);
      
      return res.redirect("/home");
      }
})

router.post("/cancel_subscription", async (req, res, next) => {
    try {
      const { s_id } = req.body;
      
      const customer = await stripe.customers.list({
          email: req.cookies._prod_email
      })
      const customerId = customer.data[0]?.id;

      // console.log(customerId, req.cookies._prod_email, s_id);

      if (!customerId && !s_id) {
        req.flash('error_msg', 'Customer not found! Try Again...');

        return res.redirect(`/home?m=${req.cookies._prod_email}`);
      }
      
      else {
        const subscription = await stripe.subscriptions.cancel(
          s_id
        );
        
        return res.redirect("/subscriptions");
      }
    }
  
    catch(error) {
          console.log(error);
      
      return res.redirect("/home");
      }
})

router.get("/resume_subscription", async (req, res, next) => {
  try {    
    const m = req.query.m || req.cookies._prod_email;
      // console.log(m);

      res.cookie("_prod_email", m);
      
      const customer = await stripe.customers.list({
          email: m
      })
      const customerId = customer.data[0]?.id;
    
    if (!customerId) {
        req.flash('error_msg', 'Customer not found! Try Again...');

        return res.redirect(`/home?m=${req.cookies._prod_email}`);
    }

    else {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://glowbal.glitch.me/subscriptions',
      });

      return res.redirect(session?.url);
    }
  }
  
  catch (error) {
    console.log(error);
    
    return res.redirect("/home");
  }
})

router.get("/videos", isAuth, async (req, res, next) => {
  try {
    const m = req.cookies._prod_email;
    // console.log(m);

    const customer = await stripe.customers.list({
        email: m
    })
    const customerId = customer.data[0]?.id;
    // console.log(customerId);

    if (customerId) {
      return res.render("video", {
        title: "VIDEO",
        isSuccess: true
      })
    }

    else {
      req.flash("error", "Invalid User... Login again");

      return res.redirect("/login");
    }
  }

  catch (error) {
    console.log(error);
    return res.redirect("/login");
  }
})

router.get("/logout", async (req, res, next) => {
  req.session.destroy((err) => {
        // console.log(err);
        res.clearCookie('_prod_email');
        return res.redirect("/login");
  });
})

// router.post("/resume_subscription", async (req, res, next) => {
//     try {
//       const { s_id } = req.body;
      
//       const customer = await stripe.customers.list({
//           email: req.cookies._prod_email
//       })
//       const customerId = customer.data[0]?.id;

//       // console.log(customerId, req.cookies._prod_email);

//       if (!customerId && !s_id) {
//         req.flash('error_msg', 'Customer not found! Try Again...');

//         return res.redirect(`/?m=${req.cookies._prod_email}`);
//       }
      
//       else {
//         const subscription = await stripe.subscriptions.resume(
//           s_id,
//           {
//             billing_cycle_anchor: 'now',
//           }
//         );
        
//         return res.redirect("/subscriptions");
//       }
//     }
  
//     catch(error) {
//        console.log(error);
      
//       return res.redirect("/");
//    }
// })

module.exports = router;