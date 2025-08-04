<template>
  <router-view />
</template>

<script setup>
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100vh;
  overflow: hidden;
}

* {
  font-family: 'Playfair Display', 'Georgia', serif;
}

body {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-weight: 600;
}

p,
span,
div {
  font-family: 'Lora', 'Georgia', serif;
}
</style>
