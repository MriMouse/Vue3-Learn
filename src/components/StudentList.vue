<template>
    <div class="info-container">
        <!-- Student Information Section -->
        <div class="student-list">
            <div class="header">
                <h2 class="title">
                    <i class="icon">👥</i>
                    Student Information List
                </h2>
                <div class="student-count">
                    Total {{ students.length }} Students
                </div>
            </div>

            <div class="table-container">
                <table class="info-table">
                    <thead>
                        <tr>
                            <th class="index-col">No.</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(student, index) in students" :key="student.id" class="info-row"
                            :class="{ 'even-row': index % 2 === 1 }">
                            <td class="index-col">{{ index + 1 }}</td>
                            <td class="name-col">
                                <span class="info-name">{{ student.name }}</span>
                            </td>
                            <td>
                                <span class="gender-badge" :class="student.gender === '男' ? 'male' : 'female'">
                                    {{ student.gender }}
                                </span>
                            </td>
                            <td class="age-col">{{ student.age }}岁</td>
                            <td class="contact-col">{{ student.contact }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Teacher Information Section -->
        <div class="teacher-list">
            <div class="header">
                <h2 class="title">
                    <i class="icon">👨‍🏫</i>
                    Teacher Information List
                </h2>
                <div class="teacher-count">
                    Total {{ teachers.length }} Teachers
                </div>
            </div>

            <div class="table-container">
                <table class="info-table">
                    <thead>
                        <tr>
                            <th class="index-col">No.</th>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Phone</th>
                            <th>Subject</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(teacher, index) in teachers" :key="teacher.workId" class="info-row"
                            :class="{ 'even-row': index % 2 === 1 }">
                            <td class="index-col">{{ index + 1 }}</td>
                            <td class="work-id-col">{{ teacher.workId }}</td>
                            <td class="name-col">
                                <span class="info-name">{{ teacher.name }}</span>
                            </td>
                            <td>
                                <span class="gender-badge" :class="teacher.gender === '男' ? 'male' : 'female'">
                                    {{ teacher.gender }}
                                </span>
                            </td>
                            <td class="age-col">{{ teacher.age }}岁</td>
                            <td class="contact-col">{{ teacher.phoneNumber }}</td>
                            <td class="course-col">
                                <span class="course-badge">{{ teacher.course }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Reactive data: store student and teacher lists (initially empty arrays)
const students = ref([])
const teachers = ref([])

// Async method: fetch student data
const fetchStudents = async () => {
    console.log('Starting to fetch student data...')
    try {
        // Send GET request to specified API endpoint (using proxy path)
        console.log('Request URL: /api/students/getAllStudents')
        const response = await axios.get('/api/students/getAllStudents')
        console.log('Student data response:', response.data)

        // Check response structure
        if (response.data.code === 200) {
            // On success, assign data field to students array
            students.value = response.data.data || []
            console.log('Student data fetch successful:', students.value)
        } else {
            // On failure, show error message
            console.error('Failed to fetch student data, error code:', response.data.code)
            console.error('Error message:', response.data.msg)
            alert(`Failed to fetch student data: ${response.data.msg || 'Unknown error'}`)
        }
    } catch (error) {
        // Network or other error handling
        console.error('Failed to fetch student data:', error)
        console.error('Error status code:', error.response?.status)
        console.error('Error message:', error.response?.data)
        alert(`Unable to load student data, error: ${error.response?.status || 'Network error'}`)
    }
}

// Async method: fetch teacher data
const fetchTeachers = async () => {
    console.log('Starting to fetch teacher data...')
    try {
        // Send GET request to specified API endpoint (using proxy path)
        console.log('Request URL: /api/teachers/getAllTeachers')
        const response = await axios.get('/api/teachers/getAllTeachers')
        console.log('Teacher data response:', response.data)

        // Check response structure
        if (response.data.code === 200) {
            // On success, assign data field to teachers array
            teachers.value = response.data.data || []
            console.log('Teacher data fetch successful:', teachers.value)
        } else {
            // On failure, show error message
            console.error('Failed to fetch teacher data, error code:', response.data.code)
            console.error('Error message:', response.data.msg)
            alert(`Failed to fetch teacher data: ${response.data.msg || 'Unknown error'}`)
        }
    } catch (error) {
        // Network or other error handling
        console.error('Failed to fetch teacher data:', error)
        console.error('Error status code:', error.response?.status)
        console.error('Error message:', error.response?.data)
        alert(`Unable to load teacher data, error: ${error.response?.status || 'Network error'}`)
    }
}

// Lifecycle hook: execute immediately after component is mounted
onMounted(() => {
    fetchStudents()  // Call student data fetch method
    fetchTeachers()  // Call teacher data fetch method
})
</script>

<style scoped>
.info-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
    font-family: 'Playfair Display', 'Georgia', serif;
}

.student-list,
.teacher-list {
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
}

.student-list {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.teacher-list {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.title {
    color: white;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.icon {
    font-size: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.student-count,
.teacher-count {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.info-table thead tr {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
}

.info-table th {
    padding: 16px 12px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    border: none;
}

.info-table td {
    padding: 14px 12px;
    text-align: center;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.3s ease;
}

.info-row {
    transition: all 0.3s ease;
}

.info-row:hover {
    background: linear-gradient(135deg, #ffeaf0 0%, #f0f8ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.even-row {
    background: rgba(248, 250, 252, 0.8);
}

.index-col {
    width: 60px;
    font-weight: 600;
    color: #666;
}

.work-id-col {
    width: 80px;
    font-weight: 600;
    color: #2d3748;
    font-family: 'Courier New', monospace;
}

.name-col {
    min-width: 100px;
}

.info-name {
    font-weight: 600;
    color: #2d3748;
    font-size: 15px;
}

.gender-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    min-width: 40px;
}

.gender-badge.male {
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(9, 132, 227, 0.3);
}

.gender-badge.female {
    background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(232, 67, 147, 0.3);
}

.age-col {
    width: 80px;
    font-weight: 500;
    color: #4a5568;
}

.contact-col {
    min-width: 120px;
    font-family: 'Courier New', monospace;
    color: #2d3748;
    letter-spacing: 0.5px;
}

.course-col {
    min-width: 100px;
}

.course-badge {
    display: inline-block;
    padding: 6px 12px;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d3748;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .info-container {
        width: 98%;
    }

    .info-table {
        font-size: 13px;
    }

    .info-table th,
    .info-table td {
        padding: 12px 8px;
    }
}

@media (max-width: 768px) {

    .student-list,
    .teacher-list {
        padding: 16px;
    }

    .header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .title {
        font-size: 24px;
    }

    .info-table {
        font-size: 12px;
    }

    .info-table th,
    .info-table td {
        padding: 10px 6px;
    }

    .contact-col {
        font-size: 11px;
    }

    .work-id-col {
        display: none;
    }

    .info-table th:nth-child(2),
    .info-table td:nth-child(2) {
        display: none;
    }
}

@media (max-width: 480px) {

    .student-list,
    .teacher-list {
        padding: 12px;
    }

    .title {
        font-size: 20px;
    }

    .info-table th,
    .info-table td {
        padding: 8px 4px;
    }

    .contact-col,
    .course-col {
        display: none;
    }

    .info-table th:nth-last-child(-n+2),
    .info-table td:nth-last-child(-n+2) {
        display: none;
    }
}
</style>