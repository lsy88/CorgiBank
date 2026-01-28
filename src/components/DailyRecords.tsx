import React, { useState } from 'react';
import { Table, Button, Form, Select, InputNumber, DatePicker, Card, message, Row, Col, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AppData, WorkRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import type { Dayjs } from 'dayjs';

interface Props {
  data: AppData;
  onAdd: (record: WorkRecord) => void;
  onDelete: (id: string) => void;
}

export const DailyRecords: React.FC<Props> = ({ data, onAdd, onDelete }) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const [itemType, setItemType] = useState<'product' | 'material'>('product');

  const handleFinish = (values: { employeeId: string; itemId: string; quantity: number; date: Dayjs; itemType: 'product' | 'material'; remarks?: string }) => {
    const record: WorkRecord = {
      id: uuidv4(),
      employeeId: values.employeeId,
      itemId: values.itemId,
      itemType: values.itemType,
      quantity: values.quantity,
      date: values.date.format('YYYY-MM-DD'),
      remarks: values.remarks,
    };
    onAdd(record);
    message.success('记录添加成功');
    form.resetFields(['itemId', 'quantity', 'remarks']);
  };

  const filteredRecords = data.records.filter(r => r.date === selectedDate.format('YYYY-MM-DD'));

  const columns = [
    { 
      title: '员工', 
      dataIndex: 'employeeId', 
      key: 'employeeId',
      render: (id: string) => data.employees.find(e => e.id === id)?.name || 'Unknown'
    },
    { 
      title: '类型', 
      dataIndex: 'itemType', 
      key: 'itemType',
      render: (type: string) => type === 'product' ? '产品' : '原料'
    },
    { 
      title: '名称', 
      key: 'itemName',
      render: (_: any, record: WorkRecord) => {
        if (record.itemType === 'product') {
          return data.products.find(p => p.id === record.itemId)?.name || 'Unknown';
        } else {
          return data.materials.find(m => m.id === record.itemId)?.name || 'Unknown';
        }
      }
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '备注', dataIndex: 'remarks', key: 'remarks' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkRecord) => (
        <Button icon={<DeleteOutlined />} danger size="small" onClick={() => onDelete(record.id)}>删除</Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="添加生产记录" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ date: dayjs(), itemType: 'product' }}>
          <Row gutter={16}>
            <Col span={3}>
              <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                <DatePicker 
                  style={{ width: '100%' }} 
                  onChange={(val: Dayjs | null) => val && setSelectedDate(val)} 
                  allowClear={false} 
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="employeeId" label="员工" rules={[{ required: true, message: '请选择员工' }]}>
                <Select placeholder="员工" showSearch optionFilterProp="children">
                  {data.employees.map(e => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="itemType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="类型" onChange={(val) => { setItemType(val); form.setFieldValue('itemId', undefined); }}>
                  <Select.Option value="product">产品</Select.Option>
                  <Select.Option value="material">原料</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="itemId" label={itemType === 'product' ? "产品" : "原料"} rules={[{ required: true, message: '请选择项目' }]}>
                <Select placeholder={itemType === 'product' ? "选择产品" : "选择原料"} showSearch optionFilterProp="children">
                  {itemType === 'product' 
                    ? data.products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)
                    : data.materials.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)
                  }
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="remarks" label="备注">
                <Input placeholder="可选备注" />
              </Form.Item>
            </Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                添加
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title={`${selectedDate.format('YYYY-MM-DD')} 生产记录`}>
        <Table 
          dataSource={filteredRecords} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
