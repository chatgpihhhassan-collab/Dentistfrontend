import axios from 'axios';

const BASE_URL = '/api/ai-dental-notes';

export const submitAudioRecording = async (audioBlob, patientId, dentistId) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('patientId', patientId);
    formData.append('dentistId', dentistId);

    const response = await axios.post(`${BASE_URL}/recordings`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Fallback for browser Web Speech API text
export const submitTranscript = async (transcriptText, patientId, dentistId) => {
    const formData = new FormData();
    formData.append('transcript', transcriptText);
    formData.append('patientId', patientId);
    formData.append('dentistId', dentistId);

    const response = await axios.post(`${BASE_URL}/recordings`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getNote = async (noteId) => {
    const response = await axios.get(`${BASE_URL}/${noteId}`);
    return response.data;
};

export const updateNote = async (noteId, noteData) => {
    const response = await axios.put(`${BASE_URL}/${noteId}`, noteData);
    return response.data;
};

export const approveNote = async (noteId) => {
    const response = await axios.post(`${BASE_URL}/${noteId}/approve`);
    return response.data;
};
