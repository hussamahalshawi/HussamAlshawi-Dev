/**
 * profileService.js —  Profile
 */
import apiClient from './api';

const profileService = {

  /** Fetches the public portfolio profile for the hero and about sections. */
  getPublicProfile: () =>
    apiClient.get('/portfolio/profile'),

    /** Fetches all profiles for the admin dashboard selector dropdown. */
  getAllProfiles: () =>
    apiClient.get('/profiles'),

    /** Fetches a single profile by MongoDB ObjectId string. */
  getProfileById: (id) =>
    apiClient.get(`/profile/${id}`),

};

export default profileService;