import './Router'
import './Config'
import './Errors'
import './ErrorHandler'
import './Log'
import './HttpServer'
import './RouteExtension'

import Grind from 'express'

module.exports = function(parameters = { }) {
	RouteExtension()

	const routerClass = parameters.routerClass || Router
	const configClass = parameters.configClass || Config
	const errorHandlerClass = parameters.errorHandlerClass || ErrorHandler

	const grind = Grind()

	grind.env = () => process.env.NODE_ENV || 'local'
	grind.routes = new routerClass(grind)
	grind.config = new configClass(grind)
	grind.errorHandler = new errorHandlerClass(grind)
	grind.booted = false
	grind.providers = [ ]
	grind.debug = grind.config.get('app.debug', grind.env() === 'local')

	grind.boot = function() {
		if(this.booted) { return }

		for(const provider of this.providers) {
			provider(this)
		}

		this.booted = true
	}

	const listen = grind.listen

	grind.listen = function(...args) {
		this.boot()

		// Register error handler
		this.use((err, req, res, next) => {
			this.errorHandler.handle(err, req, res, next)
		})

		// Register 404 handler
		this.use((req, res, next) => {
			this.errorHandler.handle(new NotFoundError, req, res, next)
		})

		return listen.apply(grind, args)
	}

	return grind
}

module.exports.Config = Config
module.exports.Router = Router
module.exports.Errors = Errors
module.exports.ErrorHandler = ErrorHandler
module.exports.HttpServer = HttpServer

global.Log = Log
