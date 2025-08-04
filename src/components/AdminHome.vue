<template>
    <div class="admin-home">
        <h1>Welcome to Admin Management System</h1>
        <p>Please select the menu on the left to perform management operations.</p>
    </div>
</template>

<script>
export default {
    name: 'AdminHome'
}
</script>

<style scoped>
.admin-home {
    color: rgb(211, 169, 101);
    background: rgb(243, 242, 234);
    text-align: center;
    margin-top: 80px;
    min-height: 60vh;
}

.admin-home h1 {
    font-size: 2.5rem;
    margin-bottom: 24px;
    color: rgb(211, 169, 101);
}
</style>
