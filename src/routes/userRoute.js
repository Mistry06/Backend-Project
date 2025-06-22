import { Router } from 'express';
import { userRegister } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js'



// Add this line
console.log('userRoute.js: Module loaded.');

const router = Router(); // THIS LINE MUST BE 'router' (lowercase)
// Add this line
console.log('userRoute.js: Express Router instance created.');
console.log('userRoute.js: Type of router instance:', typeof router); // Should be 'function'

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    userRegister); // Use the lowercase 'router' here

// Add this line
console.log('userRoute.js: POST /register route defined on router.');
console.log('userRoute.js: Checking if userRegister is a function:', typeof userRegister); // Should be 'function'

export default router;
// Add this line
console.log('userRoute.js: Router exported as default.');