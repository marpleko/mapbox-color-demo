<template>
    <div id="app">
        <nav>
            <div>
                <router-link to="/layer-demo">Layer Demo</router-link>

            </div>
            <div>
                <router-link to="/color-demo">Color Demo</router-link>
            </div>
            <!-- <div>
                <router-link to="/color-choose">Color Choose</router-link>
            </div> -->
        </nav>
        <router-view></router-view>
    </div>
</template>

<script setup>
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: left;
    color: #2c3e50;
}

nav {
    padding: 30px;
}

nav a {
    font-weight: bold;
    color: #2c3e50;
}

nav a.router-link-exact-active {
    color: #42b983;
}
</style>