import { Router } from 'express'
import { SigninController } from './controllers/SigninController'
import { SignupController } from './controllers/SignupController'
import { authMiddleware } from './middlewares/authMiddleware'

const routes = Router()

routes.post('/signup', new SignupController().create)
routes.post('/signin', new SigninController().login)

routes.use(authMiddleware)

routes.get('/profile', new SigninController().getProfile)

export default routes
