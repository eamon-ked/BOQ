// Clean master database for distribution
// This ensures new installations start with an empty database

export const masterDatabase = [];

export const categories = [
  'CCTV',
  'Access Control', 
  'PAVA',
  'Cabling',
  'Network',
  'Power',
  'Storage',
  'Accessories',
  'General'
];

// No sample items for clean installation
export default {
  masterDatabase,
  categories
};