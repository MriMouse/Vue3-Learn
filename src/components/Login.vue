<template>
    <div class="login-container">
        <div class="login-form">
            <h2 class="login-title">Admin Login</h2>

            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" v-model="username" placeholder="Enter username" class="form-input" />
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="password" placeholder="Enter password"
                    class="form-input" />
            </div>

            <div class="slider-container">
                <div class="slider-track" ref="sliderTrack" :class="{ completed: isSliderCompleted }">
                    <div class="slider-button" ref="sliderButton" @mousedown="startSlide"
                        :style="{ left: sliderPosition + 'px' }">
                        <span class="slider-icon" v-if="!isSliderCompleted">→</span>
                        <span class="slider-icon" v-else>✓</span>
                    </div>
                    <span class="slider-text" :class="{ completed: isSliderCompleted }">
                        {{ isSliderCompleted ? 'Verified' : 'Slide to verify' }}
                    </span>
                </div>
            </div>

            <button class="login-button" @click="handleLogin" :disabled="!canLogin" :class="{ disabled: !canLogin }">
                Login
            </button>

            <div v-if="message" class="message" :class="messageType">
                {{ message }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginForm',
    data() {
        return {
            username: '',
            password: '',
            sliderPosition: 0,
            isSliderCompleted: false,
            isDragging: false,
            message: '',
            messageType: 'success'
        }
    },
    computed: {
        canLogin() {
            return this.username.trim() &&
                this.password.trim() &&
                this.isSliderCompleted;
        }
    },
    methods: {
        startSlide() {
            if (this.isSliderCompleted) return;

            this.isDragging = true;
            const track = this.$refs.sliderTrack;
            const button = this.$refs.sliderButton;
            const trackRect = track.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();

            const maxPosition = trackRect.width - buttonRect.width;

            const handleMouseMove = (e) => {
                if (!this.isDragging) return;

                const newPosition = e.clientX - trackRect.left - buttonRect.width / 2;
                this.sliderPosition = Math.max(0, Math.min(newPosition, maxPosition));

                // 检查是否滑动到了最右边
                if (this.sliderPosition >= maxPosition - 5) {
                    this.isSliderCompleted = true;
                    this.isDragging = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
            };

            const handleMouseUp = () => {
                if (!this.isSliderCompleted) {
                    this.sliderPosition = 0;
                }
                this.isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },

        async handleLogin() {
            if (!this.canLogin) return;

            try {
                // 这里调用后端API，使用 axios 并走 /api 代理
                const axios = (await import('axios')).default;
                const params = new URLSearchParams();
                params.append('username', this.username);
                params.append('password', this.password);
                const response = await axios.post('/api/admin/login', params);
                const result = response.data;
                console.log(result);

                if (result.code === 200 && result.data === true) {
                    this.message = result.message || 'Admin login successful';
                    this.messageType = 'success';
                    // 跳转到后台管理界面
                    this.$router.replace({ name: 'admin' });
                } else {
                    this.message = result.message || 'Admin login failed';
                    this.messageType = 'error';
                    this.resetSlider();
                }
            } catch (error) {
                this.message = 'Network error, please try again later';
                this.messageType = 'error';
                this.resetSlider();
            }
        },

        resetSlider() {
            this.sliderPosition = 0;
            this.isSliderCompleted = false;
        }
    }
}
</script>

<style scoped>
* {
    font-family: 'Alice', serif;
    font-weight: bold;
}

.login-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #f5f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    z-index: 9999;
}

body {
    overflow: hidden;
}

.login-form {
    background: rgb(255, 255, 255);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2);
    user-select: none;
}

.login-title {
    text-align: center;
    font-family: 'Playball', cursive, 'Times New Roman', serif;
    margin-bottom: 30px;
    color: #333;
    font-size: 50px;
    font-weight: 700;
    letter-spacing: 2px;
}

.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-size: 14px;
    font-weight: bold;
}

.form-input {
    width: 100%;
    padding: 15px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    background: rgba(255, 228, 228, 0.377);
    backdrop-filter: blur(5px);
    font-size: 16px;
    color: #333;
    transition: all 0.3s ease;
    box-sizing: border-box;
    user-select: text;
}

.form-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.form-input::placeholder {
    color: #999;
}

.slider-container {
    margin: 30px 0;
}

.slider-track {
    position: relative;
    height: 50px;
    background: rgba(200, 200, 200, 0.4);
    border-radius: 25px;
    border: 1px solid rgba(150, 150, 150, 0.5);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
}

.slider-track.completed {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
}

.slider-button {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.slider-button:active {
    cursor: grabbing;
    transform: translateY(-50%) scale(1.1);
}

.slider-icon {
    color: white;
    font-size: 24px;
    font-weight: 900;
    user-select: none;
}

.slider-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #666;
    font-size: 14px;
    pointer-events: none;
    transition: all 0.3s ease;
}

.slider-text.completed {
    color: #2E7D32;
    font-weight: bold;
}

.login-button {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 1px;
}

.login-button:hover:not(.disabled) {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-button.disabled {
    background: rgba(200, 200, 200, 0.5);
    cursor: not-allowed;
    transform: none;
}

.message {
    margin-top: 20px;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
}

.message.success {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.message.error {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 响应式设计 */
@media (max-width: 480px) {
    .login-form {
        padding: 30px 20px;
        margin: 10px;
    }

    .login-title {
        font-size: 24px;
    }
}
</style>