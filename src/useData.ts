import { useState, useEffect } from 'react';
import { AppData, Employee, Product, Material, WorkRecord, Batch, LossRecord } from './types';

export const useData = () => {
  const [data, setData] = useState<AppData>({ employees: [], products: [], materials: [], records: [], batches: [], losses: [] });
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
          records: result.records || [],
          batches: result.batches || [],
          losses: result.losses || []
        });
      } else {
        // Fallback to localStorage for Web/Mobile
        const storedData = localStorage.getItem('corgibank-data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setData({
             employees: parsed.employees || [],
             products: parsed.products || [],
             materials: parsed.materials || [],
             records: parsed.records || [],
             batches: parsed.batches || [],
             losses: parsed.losses || []
          });
        } else {
          // Initial seed data if nothing in storage
          const initialData: AppData = {
            employees: [],
            products: [],
            materials: [],
            records: [],
            batches: [],
            losses: []
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
      localStorage.setItem('corgibank-data', JSON.stringify(newData));
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

  // Batch Actions
  const addBatch = (batch: Batch) => {
    saveData({ ...data, batches: [...data.batches, batch] });
  };

  const updateBatch = (batch: Batch) => {
    saveData({
      ...data,
      batches: data.batches.map(b => b.id === batch.id ? batch : b)
    });
  };

  const deleteBatch = (id: string) => {
    saveData({ ...data, batches: data.batches.filter(b => b.id !== id) });
  };

  // Loss Actions
  const addLoss = (loss: LossRecord) => {
    saveData({ ...data, losses: [...(data.losses || []), loss] });
  };

  const updateLoss = (loss: LossRecord) => {
    saveData({
      ...data,
      losses: (data.losses || []).map(l => l.id === loss.id ? loss : l)
    });
  };

  const deleteLoss = (id: string) => {
    saveData({ ...data, losses: (data.losses || []).filter(l => l.id !== id) });
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
    addBatch,
    updateBatch,
    deleteBatch,
    addLoss,
    updateLoss,
    deleteLoss,
    openDataFolder
  };
};
