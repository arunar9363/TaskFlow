import { createContext, useContext, useReducer, useCallback } from 'react';
import { projectService, taskService } from '../services';
import { toast } from '../components/ui/Toast';

const AppContext = createContext(null);

const initialState = {
  projects: [],
  tasks: [],
  selectedProject: null,
  projectsLoading: false,
  tasksLoading: false,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, projectsLoading: false };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, tasksLoading: false };
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => p._id === action.payload._id ? action.payload : p),
        selectedProject: state.selectedProject?._id === action.payload._id ? action.payload : state.selectedProject,
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p._id !== action.payload),
        selectedProject: state.selectedProject?._id === action.payload ? null : state.selectedProject,
      };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map((t) => t._id === action.payload._id ? action.payload : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t._id !== action.payload) };
    case 'SET_PROJECTS_LOADING':
      return { ...state, projectsLoading: action.payload };
    case 'SET_TASKS_LOADING':
      return { ...state, tasksLoading: action.payload };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const fetchProjects = useCallback(async () => {
    dispatch({ type: 'SET_PROJECTS_LOADING', payload: true });
    try {
      const { data } = await projectService.getAll();
      dispatch({ type: 'SET_PROJECTS', payload: data.data.projects });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load projects');
      dispatch({ type: 'SET_PROJECTS_LOADING', payload: false });
    }
  }, []);

  const fetchTasks = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_TASKS_LOADING', payload: true });
    try {
      const { data } = await taskService.getAll(params);
      dispatch({ type: 'SET_TASKS', payload: data.data.tasks });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load tasks');
      dispatch({ type: 'SET_TASKS_LOADING', payload: false });
    }
  }, []);

  const createProject = useCallback(async (projectData) => {
    const { data } = await projectService.create(projectData);
    dispatch({ type: 'ADD_PROJECT', payload: data.data.project });
    toast.success('Project created');
    return data.data.project;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    const { data } = await projectService.update(id, updates);
    dispatch({ type: 'UPDATE_PROJECT', payload: data.data.project });
    toast.success('Project updated');
    return data.data.project;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await projectService.delete(id);
    dispatch({ type: 'DELETE_PROJECT', payload: id });
    toast.success('Project deleted');
  }, []);

  const createTask = useCallback(async (taskData) => {
    const { data } = await taskService.create(taskData);
    dispatch({ type: 'ADD_TASK', payload: data.data.task });
    toast.success('Task created');
    return data.data.task;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    const { data } = await taskService.update(id, updates);
    dispatch({ type: 'UPDATE_TASK', payload: data.data.task });
    return data.data.task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await taskService.delete(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    toast.success('Task deleted');
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      fetchProjects,
      fetchTasks,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      setSelectedProject: (p) => dispatch({ type: 'SET_SELECTED_PROJECT', payload: p }),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
