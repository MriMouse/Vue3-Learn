<template>
    <div v-if="visible" class="confirm-dialog-overlay" @click="handleOverlayClick">
        <div class="confirm-dialog" @click.stop>
            <div class="confirm-header">
                <div class="confirm-icon">{{ icon }}</div>
                <h3 class="confirm-title">{{ title }}</h3>
                <button class="close-btn" @click="handleCancel">✕</button>
            </div>

            <div class="confirm-content">
                <p class="confirm-message">{{ message }}</p>
            </div>

            <div class="confirm-actions">
                <button class="cancel-btn" @click="handleCancel" :disabled="loading">
                    {{ cancelText }}
                </button>
                <button class="confirm-btn" @click="handleConfirm" :disabled="loading" :class="{ 'loading': loading }">
                    <span v-if="loading" class="loading-spinner"></span>
                    {{ loading ? loadingText : confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: '确认'
    },
    message: {
        type: String,
        default: '确定要执行此操作吗？'
    },
    confirmText: {
        type: String,
        default: '确定'
    },
    cancelText: {
        type: String,
        default: '取消'
    },
    loadingText: {
        type: String,
        default: '处理中...'
    },
    icon: {
        type: String,
        default: '❓'
    },
    type: {
        type: String,
        default: 'default', // default, warning, danger, success
        validator: (value) => ['default', 'warning', 'danger', 'success'].includes(value)
    },
    loading: {
        type: Boolean,
        default: false
    },
    closeOnOverlay: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const handleConfirm = () => {
    if (!props.loading) {
        emit('confirm')
    }
}

const handleCancel = () => {
    if (!props.loading) {
        emit('cancel')
        emit('update:visible', false)
    }
}

const handleOverlayClick = () => {
    if (props.closeOnOverlay && !props.loading) {
        emit('update:visible', false)
    }
}
</script>

<style scoped>
.confirm-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
    backdrop-filter: blur(4px);
}

.confirm-dialog {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: dialogSlideIn 0.3s ease-out;
    overflow: hidden;
}

@keyframes dialogSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.confirm-header {
    display: flex;
    align-items: center;
    padding: 24px 24px 16px;
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
    position: relative;
}

.confirm-icon {
    font-size: 2rem;
    margin-right: 16px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.confirm-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
    flex: 1;
    font-family: 'Playfair Display', 'Georgia', serif;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.confirm-content {
    padding: 24px;
    background: #fafafa;
}

.confirm-message {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.6;
    color: #333;
    text-align: center;
    font-family: 'Lora', 'Georgia', serif;
}

.confirm-actions {
    display: flex;
    gap: 16px;
    padding: 20px 24px 24px;
    background: white;
    border-top: 1px solid #eee;
}

.cancel-btn,
.confirm-btn {
    flex: 1;
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Lora', 'Georgia', serif;
    position: relative;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cancel-btn {
    background: #f8f9fa;
    color: #6c757d;
    border: 2px solid #e9ecef;
}

.cancel-btn:hover:not(:disabled) {
    background: #e9ecef;
    border-color: #dee2e6;
    transform: translateY(-1px);
}

.confirm-btn {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
    border: 2px solid transparent;
}

.confirm-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(211, 169, 101, 0.3);
}

.confirm-btn:disabled,
.cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.confirm-btn.loading {
    background: linear-gradient(135deg, #6c757d, #5a6268);
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 类型变体 */
.confirm-btn.type-warning {
    background: linear-gradient(135deg, #ffc107, #e0a800);
}

.confirm-btn.type-danger {
    background: linear-gradient(135deg, #dc3545, #c82333);
}

.confirm-btn.type-success {
    background: linear-gradient(135deg, #28a745, #20c997);
}

/* 响应式设计 */
@media (max-width: 480px) {
    .confirm-dialog {
        width: 95%;
        margin: 20px;
    }

    .confirm-header {
        padding: 20px 20px 12px;
    }

    .confirm-content {
        padding: 20px;
    }

    .confirm-actions {
        padding: 16px 20px 20px;
        flex-direction: column;
    }

    .cancel-btn,
    .confirm-btn {
        width: 100%;
    }

    .confirm-title {
        font-size: 1.2rem;
    }

    .confirm-message {
        font-size: 1rem;
    }
}
</style>
