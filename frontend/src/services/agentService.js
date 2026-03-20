/**
 * agentService.js — Agent management API calls.
 * Returns a hook (useAgentService) exposing all agent CRUD methods.
 */
import { useAuthApi } from './api';
import { useMemo } from 'react';

export function useAgentService() {
  const authApi = useAuthApi();

  return useMemo(() => ({
    /**
     * List all agents with optional filters.
     * @param {Object} params — page, per_page, search, sort_by, sort_dir, team
     */
    listAgents: (params = {}) => authApi.get('/api/agents', { params }),

    /**
     * Get a single agent profile by ID.
     * @param {string} agentId
     */
    getAgent: (agentId) => authApi.get(`/api/agents/${agentId}`),

    /**
     * Create a new agent.
     * @param {Object} data — name, email, team, manager_id
     */
    createAgent: (data) => authApi.post('/api/agents', data),

    /**
     * Update an existing agent.
     * @param {string} agentId
     * @param {Object} data — name?, email?, team?, is_active?
     */
    updateAgent: (agentId, data) => authApi.put(`/api/agents/${agentId}`, data),

    /**
     * Get all analysis reports for a specific agent.
     * @param {string} agentId
     * @param {Object} params — page, per_page
     */
    getAgentReports: (agentId, params = {}) =>
      authApi.get(`/api/agents/${agentId}/reports`, { params }),
  }), [authApi]);
}

// Legacy alias
export const agentService = {
  listAgents: () => Promise.reject(new Error('Use useAgentService().listAgents() instead')),
};
