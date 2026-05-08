/**
 * profileService.js — كل طلبات الـ Profile
 */
import apiClient from './api';

const profileService = {

  /** جلب الـ profile العام */
  getPublicProfile: () =>
    apiClient.get('/portfolio/profile'),

  /** جلب الـ profiles كلها (للـ dashboard) */
  getAllProfiles: () =>
    apiClient.get('/profiles'),

  /** جلب profile محدد بالـ ID */
  getProfileById: (id) =>
    apiClient.get(`/profile/${id}`),

};

export default profileService;