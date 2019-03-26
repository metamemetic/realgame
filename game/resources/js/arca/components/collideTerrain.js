'use strict'


module.exports = function (arca) {
	return {

		name: 'collideTerrain',

		state: {
			callback: null
		},

		onAdd: function (eid, state) {
			// add collide handler for physics engine to call
			var ents = arca.entities
			if (ents.hasPhysics(eid)) {
				var body = ents.getPhysicsBody(eid)
				body.onCollide = function bodyOnCollide(impulse) {
					var cb = arca.ents.getCollideTerrain(eid).callback
					if (cb) cb(impulse, eid)
				}
			}
		},

		onRemove: function (eid, state) {
			var ents = arca.entities
			if (ents.hasPhysics(eid)) {
				ents.getPhysicsBody(eid).onCollide = null
			}
		},


		system: null


	}
}

