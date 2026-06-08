import axios from 'axios';

const AUTH_URL = 'http://localhost:5001/api';
const VACANCY_URL = 'http://localhost:5002/api';
const STUDY_URL = 'http://localhost:5003/api';
const QUIZ_URL = 'http://localhost:5004/api';  

const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// Auth
export const registerUser = (data) => axios.post(`${AUTH_URL}/auth/register`, data);
export const loginUser = (data) => axios.post(`${AUTH_URL}/auth/login`, data);
export const getProfile = () => axios.get(`${AUTH_URL}/auth/profile`, authHeaders());

// Vacancies
export const getVacancies = () => axios.get(`${VACANCY_URL}/vacancies`, authHeaders());
export const createVacancy = (data) => axios.post(`${VACANCY_URL}/vacancies`, data, authHeaders());
export const updateVacancy = (id, data) => axios.put(`${VACANCY_URL}/vacancies/${id}`, data, authHeaders());
export const deleteVacancy = (id) => axios.delete(`${VACANCY_URL}/vacancies/${id}`, authHeaders());
export const applyVacancy = (id) => axios.post(`${VACANCY_URL}/vacancies/${id}/apply`, {}, authHeaders());
export const getMyApplications = () => axios.get(`${VACANCY_URL}/applications/my`, authHeaders());

// Study Materials
export const getMaterials = () => axios.get(`${STUDY_URL}/study-materials`, authHeaders());
export const createMaterial = (data) => axios.post(`${STUDY_URL}/study-materials`, data, authHeaders());
export const deleteMaterial = (id) => axios.delete(`${STUDY_URL}/study-materials/${id}`, authHeaders());

// Quizzes ← FIXED
export const getQuizzes = () => axios.get(`${QUIZ_URL}/quizzes`, authHeaders());
export const submitQuiz = (id, answers) => axios.post(`${QUIZ_URL}/quizzes/${id}/submit`, answers, authHeaders());
export const getMyProgress = () => axios.get(`${QUIZ_URL}/quizzes/results/me`, authHeaders());