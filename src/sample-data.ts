/**
 * Sample Data for Testing
 * Use this to populate your database with test data
 * 
 * IMPORTANT: These are TypeScript objects. To insert into MongoDB:
 * 1. Use MongoDB Compass: Copy objects and paste in Insert Document
 * 2. Use MongoDB Shell: Run the commands at the bottom
 * 3. Use the app: Sign in as admin and add items manually
 */

import { Item, ItemStatus } from './types/models';

// Sample Items
export const sampleItems: Omit<Item, '_id'>[] = [
  {
    name: 'Dell XPS 15 Laptop',
    location: 'Office - Desk 5',
    quantity: 3,
    tags: ['electronics', 'laptop', 'computers', 'work'],
    description: 'High-performance laptop with i7 processor, 16GB RAM, 512GB SSD. Ideal for development and design work.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'MacBook Pro 16"',
    location: 'Office - Tech Storage',
    quantity: 2,
    tags: ['electronics', 'laptop', 'apple', 'development'],
    description: 'Apple MacBook Pro 16" with M2 Pro chip, 32GB RAM, 1TB SSD. For iOS development and video editing.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Epson EB-X41 Projector',
    location: 'Meeting Room A',
    quantity: 1,
    tags: ['electronics', 'presentation', 'projector', 'meetings'],
    description: 'HD projector with 3600 lumens brightness. Perfect for presentations and meetings.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Logitech MX Master 3 Mouse',
    location: 'Supply Closet - Shelf B',
    quantity: 10,
    tags: ['electronics', 'accessories', 'mouse', 'peripherals'],
    description: 'Ergonomic wireless mouse with advanced features and long battery life.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Mechanical Keyboard - Keychron K8',
    location: 'Supply Closet - Shelf B',
    quantity: 8,
    tags: ['electronics', 'accessories', 'keyboard', 'peripherals'],
    description: 'Wireless mechanical keyboard with RGB backlight. Hot-swappable switches.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'USB-C Hub (7-in-1)',
    location: 'Supply Closet - Drawer 3',
    quantity: 15,
    tags: ['electronics', 'accessories', 'usb', 'adapters'],
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Wireless Headphones - Sony WH-1000XM5',
    location: 'Office - Equipment Cabinet',
    quantity: 5,
    tags: ['electronics', 'audio', 'headphones', 'noise-cancelling'],
    description: 'Premium noise-cancelling wireless headphones. 30-hour battery life.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Whiteboard Markers (Pack of 12)',
    location: 'Supply Closet - Shelf A',
    quantity: 20,
    tags: ['office supplies', 'stationary', 'markers', 'whiteboard'],
    description: 'Assorted color dry-erase markers. Low-odor, quick-drying.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Webcam - Logitech C920',
    location: 'Office - Tech Storage',
    quantity: 6,
    tags: ['electronics', 'camera', 'video', 'webcam'],
    description: 'Full HD 1080p webcam with auto-focus. Perfect for video calls and streaming.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'External Monitor - Dell 27" 4K',
    location: 'Office - Equipment Room',
    quantity: 4,
    tags: ['electronics', 'monitor', 'display', '4k'],
    description: '27-inch 4K UHD monitor with IPS panel. USB-C connectivity.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Notebook - Moleskine Classic',
    location: 'Supply Closet - Shelf C',
    quantity: 30,
    tags: ['office supplies', 'stationary', 'notebook', 'writing'],
    description: 'Classic hardcover notebook with ruled pages. 240 pages.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Power Bank - Anker 20000mAh',
    location: 'Supply Closet - Drawer 2',
    quantity: 12,
    tags: ['electronics', 'accessories', 'charging', 'power bank'],
    description: 'High-capacity portable charger with fast charging. Charges laptops and phones.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'HDMI Cable (6ft)',
    location: 'Supply Closet - Drawer 4',
    quantity: 25,
    tags: ['electronics', 'cables', 'hdmi', 'accessories'],
    description: 'High-speed HDMI 2.1 cable supporting 4K@60Hz.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Standing Desk Converter',
    location: 'Office - Storage Area',
    quantity: 3,
    tags: ['furniture', 'desk', 'ergonomic', 'office'],
    description: 'Adjustable height desk converter. Easy gas-spring lift mechanism.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Conference Phone - Jabra Speak',
    location: 'Meeting Room B',
    quantity: 2,
    tags: ['electronics', 'audio', 'conference', 'meetings'],
    description: 'Portable speakerphone for conference calls. 360-degree microphone.',
    status: ItemStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// MongoDB Shell Commands to Insert Sample Data
export const mongoShellCommands = `
// Connect to your MongoDB cluster first, then run:

use inventory_system

// Insert sample items
db.items.insertMany([
  {
    name: "Dell XPS 15 Laptop",
    location: "Office - Desk 5",
    quantity: 3,
    tags: ["electronics", "laptop", "computers", "work"],
    description: "High-performance laptop with i7 processor, 16GB RAM, 512GB SSD. Ideal for development and design work.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "MacBook Pro 16\\"",
    location: "Office - Tech Storage",
    quantity: 2,
    tags: ["electronics", "laptop", "apple", "development"],
    description: "Apple MacBook Pro 16\\" with M2 Pro chip, 32GB RAM, 1TB SSD. For iOS development and video editing.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Epson EB-X41 Projector",
    location: "Meeting Room A",
    quantity: 1,
    tags: ["electronics", "presentation", "projector", "meetings"],
    description: "HD projector with 3600 lumens brightness. Perfect for presentations and meetings.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Logitech MX Master 3 Mouse",
    location: "Supply Closet - Shelf B",
    quantity: 10,
    tags: ["electronics", "accessories", "mouse", "peripherals"],
    description: "Ergonomic wireless mouse with advanced features and long battery life.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mechanical Keyboard - Keychron K8",
    location: "Supply Closet - Shelf B",
    quantity: 8,
    tags: ["electronics", "accessories", "keyboard", "peripherals"],
    description: "Wireless mechanical keyboard with RGB backlight. Hot-swappable switches.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Whiteboard Markers (Pack of 12)",
    location: "Supply Closet - Shelf A",
    quantity: 20,
    tags: ["office supplies", "stationary", "markers", "whiteboard"],
    description: "Assorted color dry-erase markers. Low-odor, quick-drying.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Webcam - Logitech C920",
    location: "Office - Tech Storage",
    quantity: 6,
    tags: ["electronics", "camera", "video", "webcam"],
    description: "Full HD 1080p webcam with auto-focus. Perfect for video calls and streaming.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "External Monitor - Dell 27\\" 4K",
    location: "Office - Equipment Room",
    quantity: 4,
    tags: ["electronics", "monitor", "display", "4k"],
    description: "27-inch 4K UHD monitor with IPS panel. USB-C connectivity.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Notebook - Moleskine Classic",
    location: "Supply Closet - Shelf C",
    quantity: 30,
    tags: ["office supplies", "stationary", "notebook", "writing"],
    description: "Classic hardcover notebook with ruled pages. 240 pages.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Power Bank - Anker 20000mAh",
    location: "Supply Closet - Drawer 2",
    quantity: 12,
    tags: ["electronics", "accessories", "charging", "power bank"],
    description: "High-capacity portable charger with fast charging. Charges laptops and phones.",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Verify insertion
db.items.countDocuments()
`;

console.log('Sample data file loaded. Use the exported data to seed your database.');
console.log('To insert via MongoDB Shell, copy the mongoShellCommands string.');
