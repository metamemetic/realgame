
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let store = new Vuex.Store({
    state: {
        user: null,
        testCount: 0,
        users: [],
        scene: null
    },

    mutations: {
        setAuthUser(state, user) {
            state.user = user;
        },

        setUser (state, user) {
            state.users[user.id] = user
        },

        setUsers (state, users) {
            users.forEach(user => {
                state.users[user.id] = user
            })
        },

        removeUserById (state, userId) {
            const user = state.users[userId]
            if (user.shape) {
                user.shape.dispose()
            }
            if (user.tag) {
                user.tag.dispose()
            }
            state.users[userId] = undefined
        }
    },

    getters: {
        isLoggedIn(state) {
            return state.user !== null;
        },

        getUsers: (state) => {
            return state.users
        },

        getUserById: (state) => (id) => {
            return state.users.find(user => {
                if (user) {
                    return user.id === id
                }
            })
        }
    }
})

/**
 * The following block of code may be used to automatically register your
 * Vue components. It will recursively scan this directory for the Vue
 * components and automatically register them with their "basename".
 *
 * Eg. ./components/ExampleComponent.vue -> <example-component></example-component>
 */

// const files = require.context('./', true, /\.vue$/i);
// files.keys().map(key => Vue.component(key.split('/').pop().split('.')[0], files(key).default));

Vue.component('babylon-canvas', require('./components/BabylonCanvas.vue').default);

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

const app = new Vue({
    el: '#app',
    store
});
