import React, { useState } from 'react';
import { Table, DatePicker, Statistic, Card, Row, Col, Radio } from 'antd';
import { AppData } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

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

  const dateStr = date.format(mode === 'month' ? 'YYYY-MM' : 'YYYY');

  // Filter records for the month or year
  const records = data.records.filter(r => r.date.startsWith(dateStr));

  // Calculate salary per employee
  const salaryMap = new Map<string, number>();
  const detailsMap = new Map<string, { totalQuantity: number }>();

  data.employees.forEach(e => {
    salaryMap.set(e.id, 0);
    detailsMap.set(e.id, { totalQuantity: 0 });
  });

  records.forEach(r => {
    let price = 0;
    if (r.itemType === 'product' || !r.itemType) { // Handle legacy records if any
        const product = data.products.find(p => p.id === r.itemId || p.id === (r as any).productId);
        if (product) price = product.price;
    } else if (r.itemType === 'material') {
        const material = data.materials.find(m => m.id === r.itemId);
        if (material) price = material.price;
    }

    if (price > 0) {
        const amount = price * r.quantity;
        salaryMap.set(r.employeeId, (salaryMap.get(r.employeeId) || 0) + amount);
        
        const details = detailsMap.get(r.employeeId);
        if (details) {
            details.totalQuantity += r.quantity;
        }
    }
  });

  const dataSource = data.employees.map(e => ({
    id: e.id,
    name: e.name,
    totalQuantity: detailsMap.get(e.id)?.totalQuantity || 0,
    salary: salaryMap.get(e.id) || 0
  }));

  const totalSalary = Array.from(salaryMap.values()).reduce((a, b) => a + b, 0);
  const totalPieces = Array.from(detailsMap.values()).reduce((a, b) => a + b.totalQuantity, 0);

  const columns = [
    { title: '员工姓名', dataIndex: 'name', key: 'name' },
    { title: '总件数', dataIndex: 'totalQuantity', key: 'totalQuantity' },
    { 
      title: '应发工资 (元)', 
      dataIndex: 'salary', 
      key: 'salary',
      render: (val: number) => `¥${val.toFixed(2)}`,
      sorter: (a: ReportRow, b: ReportRow) => a.salary - b.salary
    },
  ];

  return (
    <div>
      <Card 
        title={`${dateStr} 统计概览`} 
        extra={
          <div style={{ display: 'flex', gap: 16 }}>
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
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Statistic title={`当${mode === 'month' ? '月' : '年'}总产量`} value={totalPieces} suffix="件" valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={12}>
            <Statistic title={`当${mode === 'month' ? '月' : '年'}总支出`} value={totalSalary} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Col>
        </Row>
      </Card>

      <Card title="工资明细">
        <Table dataSource={dataSource} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
};
