import { createRouter, createWebHistory } from "vue-router";
import StudentList from "../components/StudentList.vue";
import LoginForm from "../components/Login.vue";
import AdminLayout from "@/components/AdminLayout.vue";

const routes = [
  { path: "/students", component: StudentList },
  { path: "/", component: LoginForm },
  { path: "/admin", name: "admin", component: AdminLayout },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
