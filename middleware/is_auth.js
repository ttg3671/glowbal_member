module.exports = (req, res, next) => {
    // console.log(req.session.isLoggedIn, req.cookies._prod_token, req.user?.rem_token);
    // console.log(req.session.isLoggedIn == 'false' && !req.cookies._prod_token && !req.user?.rem_token);
    
    if(!req.cookies._prod_email) {
        return res.redirect("/login");
    }
    else return next();
}