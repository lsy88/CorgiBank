import { useState, useEffect } from 'react';
import { AppData, Employee, Product, Material, WorkRecord } from './types';

export const useData = () => {
  const [data, setData] = useState<AppData>({ employees: [], products: [], materials: [], records: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (window.ipcRenderer) {
        const result = await window.ipcRenderer.invoke('read-data');
        // Ensure all arrays exist
        setData({
          employees: result.employees || [],
          products: result.products || [],
          materials: result.materials || [],
          records: result.records || []
        });
      } else {
        // Fallback to localStorage for Web/Mobile
        const storedData = localStorage.getItem('salary-manager-data');
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
          // Initial seed data if nothing in storage
          const initialData: AppData = {
            employees: [],
            products: [],
            materials: [],
            records: []
          };
          setData(initialData);
        }
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: AppData) => {
    setData(newData);
    if (window.ipcRenderer) {
      await window.ipcRenderer.invoke('write-data', newData);
    } else {
      // Save to localStorage for Web/Mobile
      localStorage.setItem('salary-manager-data', JSON.stringify(newData));
    }
  };

  // Employee Actions
  const addEmployee = (employee: Employee) => {
    saveData({ ...data, employees: [...data.employees, employee] });
  };

  const updateEmployee = (employee: Employee) => {
    saveData({
      ...data,
      employees: data.employees.map(e => e.id === employee.id ? employee : e)
    });
  };

  const deleteEmployee = (id: string) => {
    saveData({ ...data, employees: data.employees.filter(e => e.id !== id) });
  };

  // Product Actions
  const addProduct = (product: Product) => {
    saveData({ ...data, products: [...data.products, product] });
  };

  const updateProduct = (product: Product) => {
    saveData({
      ...data,
      products: data.products.map(p => p.id === product.id ? product : p)
    });
  };

  const deleteProduct = (id: string) => {
    saveData({ ...data, products: data.products.filter(p => p.id !== id) });
  };

  // Material Actions
  const addMaterial = (material: Material) => {
    saveData({ ...data, materials: [...data.materials, material] });
  };

  const updateMaterial = (material: Material) => {
    saveData({
      ...data,
      materials: data.materials.map(m => m.id === material.id ? material : m)
    });
  };

  const deleteMaterial = (id: string) => {
    saveData({ ...data, materials: data.materials.filter(m => m.id !== id) });
  };

  // Record Actions
  const addRecord = (record: WorkRecord) => {
    saveData({ ...data, records: [...data.records, record] });
  };

  const updateRecord = (record: WorkRecord) => {
    saveData({
      ...data,
      records: data.records.map(r => r.id === record.id ? record : r)
    });
  };

  const deleteRecord = (id: string) => {
    saveData({ ...data, records: data.records.filter(r => r.id !== id) });
  };

  const openDataFolder = async () => {
    if (window.ipcRenderer) {
      await window.ipcRenderer.invoke('open-data-folder');
    } else {
      console.log('Not in Electron environment');
    }
  };

  return {
    data,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addProduct,
    updateProduct,
    deleteProduct,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addRecord,
    updateRecord,
    deleteRecord,
    openDataFolder
  };
};
