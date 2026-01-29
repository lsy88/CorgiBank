import React, { useState } from 'react';
import { Table, DatePicker, Statistic, Card, Row, Col, Radio, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { AppData, Batch } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

interface Props {
  data: AppData;
}

interface ReportRow {
  id: string;
  name: string;
  totalQuantity: number;
  salary: number;
}

export const SalaryReport: React.FC<Props> = ({ data }) => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [viewType, setViewType] = useState<'employee' | 'batch'>('employee');

  const dateStr = date.format(mode === 'month' ? 'YYYY-MM' : 'YYYY');

  // Calculate salary per employee from Batches
  const salaryMap = new Map<string, number>();
  const quantityMap = new Map<string, number>();

  data.employees.forEach(e => {
    salaryMap.set(e.id, 0);
    quantityMap.set(e.id, 0);
  });

  // Filter batches for the selected period
  const batches = (data.batches || [])
    .filter(b => b.date.startsWith(dateStr))
    .sort((a, b) => b.date.localeCompare(a.date));

  batches.forEach(batch => {
      // 1. Calculate Total Value of the Batch (Products * SnapshotPrice)
      let batchValue = 0;
      let batchQuantity = 0;

      (batch.products || []).forEach(p => {
          batchValue += (p.quantity * (p.snapshotPrice || 0));
          batchQuantity += p.quantity;
      });

      // 2. Distribute among employees
      let totalShare = 0;
      (batch.employees || []).forEach(e => {
          totalShare += (e.share || 1);
      });

      if (totalShare > 0) {
          (batch.employees || []).forEach(e => {
              const ratio = (e.share || 1) / totalShare;
              const salary = batchValue * ratio;
              const quantity = batchQuantity * ratio;

              salaryMap.set(e.employeeId, (salaryMap.get(e.employeeId) || 0) + salary);
              quantityMap.set(e.employeeId, (quantityMap.get(e.employeeId) || 0) + quantity);
          });
      }
  });

  // Employee View Data
  const employeeDataSource = data.employees.map(e => ({
    id: e.id,
    name: e.name,
    totalQuantity: Math.round(quantityMap.get(e.id) || 0),
    salary: salaryMap.get(e.id) || 0
  }));

  // Batch View Data
  const batchDataSource = batches.map(b => {
    const salaryVal = (b.products || []).reduce((acc, p) => acc + (p.quantity * (p.snapshotPrice || 0)), 0);
    const materialVal = (b.materials || []).reduce((acc, m) => acc + (m.quantity * (m.snapshotPrice || 0)), 0);
    const productQty = (b.products || []).reduce((acc, p) => acc + p.quantity, 0);
    return {
        id: b.id,
        name: b.name,
        date: b.date,
        salaryValue: salaryVal,
        materialCost: materialVal,
        productCount: productQty,
        employeeCount: (b.employees || []).length,
        rawBatch: b
    };
  });

  const handleExport = () => {
    // 1. Batches Overview Sheet
    const batchesSheetData = batches.map(b => {
        const salaryVal = (b.products || []).reduce((acc, p) => acc + (p.quantity * (p.snapshotPrice || 0)), 0);
        const materialVal = (b.materials || []).reduce((acc, m) => acc + (m.quantity * (m.snapshotPrice || 0)), 0);
        return {
            '批次ID': b.id,
            '批次名称': b.name,
            '日期': b.date,
            '总产值(工资)': salaryVal,
            '总原料成本': materialVal,
            '备注': b.remarks || ''
        };
    });

    // 2. Products Sheet
    const productsSheetData: any[] = [];
    batches.forEach(b => {
        (b.products || []).forEach(p => {
            const pName = data.products.find(prod => prod.id === p.productId)?.name || '未知产品';
            productsSheetData.push({
                '批次名称': b.name,
                '日期': b.date,
                '产品名称': pName,
                '数量': p.quantity,
                '单价(快照)': p.snapshotPrice,
                '小计': p.quantity * (p.snapshotPrice || 0)
            });
        });
    });

    // 3. Materials Sheet
    const materialsSheetData: any[] = [];
    batches.forEach(b => {
        (b.materials || []).forEach(m => {
            const mName = data.materials.find(mat => mat.id === m.materialId)?.name || '未知原料';
            materialsSheetData.push({
                '批次名称': b.name,
                '日期': b.date,
                '原料名称': mName,
                '数量': m.quantity,
                '单价(快照)': m.snapshotPrice,
                '小计': m.quantity * (m.snapshotPrice || 0)
            });
        });
    });

    // 4. Employees Salary Sheet
    const employeesSheetData: any[] = [];
    batches.forEach(b => {
        const salaryVal = (b.products || []).reduce((acc, p) => acc + (p.quantity * (p.snapshotPrice || 0)), 0);
        const productQty = (b.products || []).reduce((acc, p) => acc + p.quantity, 0);

        let totalShare = 0;
        (b.employees || []).forEach(e => totalShare += (e.share || 1));

        (b.employees || []).forEach(e => {
            const eName = data.employees.find(emp => emp.id === e.employeeId)?.name || '未知员工';
            const ratio = totalShare > 0 ? (e.share || 1) / totalShare : 0;
            employeesSheetData.push({
                '批次名称': b.name,
                '日期': b.date,
                '员工姓名': eName,
                '分配比例': e.share || 1,
                '分配工资': Number((salaryVal * ratio).toFixed(2)),
                '分配数量(估算)': Number((productQty * ratio).toFixed(1))
            });
        });
    });
    
    const wb = XLSX.utils.book_new();

    const wsBatches = XLSX.utils.json_to_sheet(batchesSheetData);
    XLSX.utils.book_append_sheet(wb, wsBatches, "批次概览");

    const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "生产详情");

    const wsMaterials = XLSX.utils.json_to_sheet(materialsSheetData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, "原料详情");

    const wsEmployees = XLSX.utils.json_to_sheet(employeesSheetData);
    XLSX.utils.book_append_sheet(wb, wsEmployees, "员工薪资详情");

    XLSX.writeFile(wb, `工资报表_${dateStr}.xlsx`);
  };

  const expandedRowRender = (record: any) => {
    const batch = record.rawBatch as Batch;
    
    let batchValue = 0;
    let batchQuantity = 0;
    (batch.products || []).forEach(p => {
        batchValue += (p.quantity * (p.snapshotPrice || 0));
        batchQuantity += p.quantity;
    });

    let totalShare = 0;
    (batch.employees || []).forEach(e => totalShare += (e.share || 1));
    
    const employeeData = (batch.employees || []).map((e, index) => {
        const employeeName = data.employees.find(emp => emp.id === e.employeeId)?.name || '未知员工';
        const ratio = totalShare > 0 ? (e.share || 1) / totalShare : 0;
        return {
            key: `${batch.id}_${e.employeeId}_${index}`,
            name: employeeName,
            share: e.share || 1,
            salary: batchValue * ratio,
            quantity: batchQuantity * ratio
        };
    });

    const columns = [
        { title: '员工姓名', dataIndex: 'name', key: 'name' },
        { title: '分配比例', dataIndex: 'share', key: 'share' },
        { title: '分配数量', dataIndex: 'quantity', key: 'quantity', render: (val: number) => val.toFixed(1) },
        { title: '分配工资', dataIndex: 'salary', key: 'salary', render: (val: number) => `¥${val.toFixed(2)}` },
    ];

    return <Table columns={columns} dataSource={employeeData} pagination={false} size="small" />;
  };

  const totalSalary = Array.from(salaryMap.values()).reduce((a, b) => a + b, 0);
  const totalPieces = Array.from(quantityMap.values()).reduce((a, b) => a + b, 0);
  const totalMaterialCost = batchDataSource.reduce((a, b) => a + b.materialCost, 0);

  const employeeColumns = [
    { title: '员工姓名', dataIndex: 'name', key: 'name' },
    { title: '总件数 (估算)', dataIndex: 'totalQuantity', key: 'totalQuantity' },
    { 
      title: '应发工资 (元)', 
      dataIndex: 'salary', 
      key: 'salary',
      render: (val: number) => `¥${val.toFixed(2)}`,
      sorter: (a: ReportRow, b: ReportRow) => a.salary - b.salary
    },
  ];

  const batchColumns = [
    { title: '批次名称', dataIndex: 'name', key: 'name' },
    { 
      title: '日期', 
      dataIndex: 'date', 
      key: 'date',
      sorter: (a: any, b: any) => a.date.localeCompare(b.date)
    },
    { 
      title: '生产数量', 
      dataIndex: 'productCount', 
      key: 'productCount',
      sorter: (a: any, b: any) => a.productCount - b.productCount 
    },
    { 
      title: '产值(工资)', 
      dataIndex: 'salaryValue', 
      key: 'salaryValue', 
      render: (val: number) => `¥${val.toFixed(2)}`,
      sorter: (a: any, b: any) => a.salaryValue - b.salaryValue
    },
    { 
      title: '原料成本', 
      dataIndex: 'materialCost', 
      key: 'materialCost', 
      render: (val: number) => `¥${val.toFixed(2)}`,
      sorter: (a: any, b: any) => a.materialCost - b.materialCost
    },
    { title: '参与人数', dataIndex: 'employeeCount', key: 'employeeCount' },
  ];

  return (
    <div>
      <Card 
        title={`${dateStr} 统计概览`} 
        extra={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Radio.Group value={viewType} onChange={e => setViewType(e.target.value)} buttonStyle="solid">
                <Radio.Button value="employee">按员工</Radio.Button>
                <Radio.Button value="batch">按批次</Radio.Button>
            </Radio.Group>
            <div style={{ width: 1, height: 20, background: '#f0f0f0' }} />
            <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
              <Radio.Button value="month">月度</Radio.Button>
              <Radio.Button value="year">年度</Radio.Button>
            </Radio.Group>
            <DatePicker 
              picker={mode} 
              value={date} 
              onChange={(val: Dayjs | null) => val && setDate(val)} 
              allowClear={false} 
            />
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                导出报表
            </Button>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={24}>
          <Col span={8}>
            <Statistic title="总支出工资" value={totalSalary} precision={2} prefix="¥" />
          </Col>
          <Col span={8}>
            <Statistic title="总原料成本" value={totalMaterialCost} precision={2} prefix="¥" />
          </Col>
          <Col span={8}>
            <Statistic title="总生产件数" value={totalPieces} precision={0} />
          </Col>
        </Row>
      </Card>

      {viewType === 'employee' ? (
        <Table 
          dataSource={employeeDataSource} 
          columns={employeeColumns} 
          rowKey="id" 
          pagination={{ pageSize: 100 }}
        />
      ) : (
        <Table 
          dataSource={batchDataSource} 
          columns={batchColumns} 
          rowKey="id" 
          pagination={{ pageSize: 100 }}
          expandable={{ 
            expandedRowRender,
            columnTitle: '详情',
            expandIconColumnIndex: 6,
            expandIcon: ({ expanded, onExpand, record }) => (
                <Button 
                  type="link" 
                  size="small"
                  onClick={e => onExpand(record, e as any)}
                  style={{ padding: 0 }}
                >
                  {expanded ? '收起' : '展开'}
                </Button>
            )
          }}
        />
      )}
    </div>
  );
};
