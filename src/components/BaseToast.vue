<template>
    <transition name="toast-fade">
        <div v-if="visible" :class="['toast', `toast-${type}`]">
            {{ message }}
        </div>
    </transition>
</template>

<script setup>
/* eslint-disable */
import { ref } from 'vue'

const props = defineProps({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'error' // 'success', 'error', 'warning'
    },
    duration: {
        type: Number,
        default: 3000
    }
})

const visible = ref(false)

const emit = defineEmits(['hide'])

let timer = null

const show = () => {
    visible.value = true
    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(() => {
        hide()
    }, props.duration)
}

const hide = () => {
    visible.value = false
    emit('hide')
}

// Expose the show method to the parent component
defineExpose({
    show
})
</script>

<style scoped>
.toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
}

.toast-error {
    background-color: #dc3545;
}

.toast-success {
    background-color: #28a745;
}

.toast-warning {
    background-color: #ffc107;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
    transition: opacity 0.5s, transform 0.5s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
}
</style>
