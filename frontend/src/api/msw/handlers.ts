// PURPOSE: MSW request handlers for FamilyHub API endpoints
// ROLE: Frontend Testing
// MODIFIED: 2026-04-23 — Phase 0 test infrastructure setup

import { http, HttpResponse } from 'msw';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

export const handlers = [
  // Authentication
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json(
      {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'member',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        access_token: 'new-test-token',
        refresh_token: 'new-test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
      },
      { status: 200 },
    );
  }),

  // Users
  http.get(`${API_URL}/users`, () => {
    return HttpResponse.json(
      [
        {
          id: '1',
          username: 'alice',
          email: 'alice@example.com',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'bob',
          email: 'bob@example.com',
          role: 'member',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { status: 200 },
    );
  }),

  http.post(`${API_URL}/users`, () => {
    return HttpResponse.json(
      {
        id: '3',
        username: 'charlie',
        email: 'charlie@example.com',
        role: 'member',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/users/:userId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        username: 'alice',
        email: 'alice@example.com',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.put(`${API_URL}/users/:userId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        username: 'alice-updated',
        email: 'alice@example.com',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  // Calendar Events
  http.get(`${API_URL}/calendar/events`, () => {
    return HttpResponse.json(
      [
        {
          id: '1',
          title: 'Family Meeting',
          description: 'Weekly family meeting',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          location: 'Living Room',
          attendees: ['1', '2'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { status: 200 },
    );
  }),

  http.post(`${API_URL}/calendar/events`, () => {
    return HttpResponse.json(
      {
        id: '2',
        title: 'Birthday Party',
        description: null,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString(),
        location: null,
        attendees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/calendar/events/:eventId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        title: 'Family Meeting',
        description: 'Weekly family meeting',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: 'Living Room',
        attendees: ['1', '2'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.put(`${API_URL}/calendar/events/:eventId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        title: 'Family Meeting Updated',
        description: 'Weekly family meeting',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        location: 'Kitchen',
        attendees: ['1', '2'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${API_URL}/calendar/events/:eventId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_URL}/calendar/sync`, () => {
    return HttpResponse.json(
      {
        synced_count: 5,
        last_sync: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  // Tasks
  http.get(`${API_URL}/tasks`, () => {
    return HttpResponse.json(
      [
        {
          id: '1',
          title: 'Buy groceries',
          description: 'Milk, eggs, bread',
          status: 'pending',
          priority: 'high',
          assigned_to: '2',
          due_date: '2026-04-25',
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { status: 200 },
    );
  }),

  http.post(`${API_URL}/tasks`, () => {
    return HttpResponse.json(
      {
        id: '2',
        title: 'Clean house',
        description: null,
        status: 'pending',
        priority: 'medium',
        assigned_to: null,
        due_date: '2026-04-26',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/tasks/:taskId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        title: 'Buy groceries',
        description: 'Milk, eggs, bread',
        status: 'pending',
        priority: 'high',
        assigned_to: '2',
        due_date: '2026-04-25',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.put(`${API_URL}/tasks/:taskId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        title: 'Buy groceries',
        description: 'Milk, eggs, bread, butter',
        status: 'in_progress',
        priority: 'high',
        assigned_to: '2',
        due_date: '2026-04-25',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${API_URL}/tasks/:taskId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Photos
  http.get(`${API_URL}/photos`, () => {
    return HttpResponse.json(
      [
        {
          id: '1',
          filename: 'family-photo-1.jpg',
          size: 2048576,
          mime_type: 'image/jpeg',
          url: 'https://familyhub.local/photos/1.jpg',
          thumbnail_url: 'https://familyhub.local/photos/1-thumb.jpg',
          uploaded_by: '1',
          uploaded_at: new Date().toISOString(),
        },
      ],
      { status: 200 },
    );
  }),

  http.post(`${API_URL}/photos`, () => {
    return HttpResponse.json(
      {
        id: '2',
        filename: 'family-photo-2.jpg',
        size: 3145728,
        mime_type: 'image/jpeg',
        url: 'https://familyhub.local/photos/2.jpg',
        thumbnail_url: 'https://familyhub.local/photos/2-thumb.jpg',
        uploaded_by: '1',
        uploaded_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}/photos/:photoId`, () => {
    return HttpResponse.json(
      {
        id: '1',
        filename: 'family-photo-1.jpg',
        size: 2048576,
        mime_type: 'image/jpeg',
        url: 'https://familyhub.local/photos/1.jpg',
        thumbnail_url: 'https://familyhub.local/photos/1-thumb.jpg',
        uploaded_by: '1',
        uploaded_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  http.delete(`${API_URL}/photos/:photoId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Health
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'ok',
      },
      { status: 200 },
    );
  }),

  http.get(`${API_URL}/health/ready`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
