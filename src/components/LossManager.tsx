import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Popconfirm, Card, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppData, LossRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

interface Props {
  data: AppData;
  onAdd: (loss: LossRecord) => void;
  onUpdate: (loss: LossRecord) => void;
  onDelete: (id: string) => void;
}

export const LossManager: React.FC<Props> = ({ data, onAdd, onUpdate, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLoss, setEditingLoss] = useState<LossRecord | null>(null);
  const [form] = Form.useForm();
  const [lossType, setLossType] = useState<'material' | 'product' | 'other'>('material');

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: LossRecord, b: LossRecord) => a.date.localeCompare(b.date),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map = { material: '原料损耗', product: '次品报废', other: '其他支出' };
        const color = { material: 'orange', product: 'red', other: 'default' };
        return <Tag color={color[type as keyof typeof color]}>{map[type as keyof typeof map]}</Tag>;
      }
    },
    {
      title: '名称',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text: string) => text || '无',
    },
    {
      title: '金额 (元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `¥${val.toFixed(2)}`,
      sorter: (a: LossRecord, b: LossRecord) => a.amount - b.amount,
    },
    {
      title: '说明',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LossRecord) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingLoss(record);
              setLossType(record.type);
              form.setFieldsValue({
                ...record,
                date: dayjs(record.date),
              });
              setIsModalVisible(true);
            }} 
          />
          <Popconfirm title="确定删除吗?" onConfirm={() => onDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleOk = () => {
    form.validateFields().then(values => {
      const lossData: LossRecord = {
        id: editingLoss ? editingLoss.id : uuidv4(),
        date: values.date.format('YYYY-MM-DD'),
        type: values.type,
        itemId: values.itemId,
        itemName: values.itemName, // Will be auto-filled or manual
        quantity: values.quantity,
        amount: values.amount,
        reason: values.reason,
      };

      // Auto-fill itemName if selecting from list
      if (values.type === 'material' && values.itemId) {
          const m = data.materials.find(m => m.id === values.itemId);
          if (m) lossData.itemName = m.name;
      } else if (values.type === 'product' && values.itemId) {
          const p = data.products.find(p => p.id === values.itemId);
          if (p) lossData.itemName = p.name;
      }

      if (editingLoss) {
        onUpdate(lossData);
      } else {
        onAdd(lossData);
      }
      setIsModalVisible(false);
      setEditingLoss(null);
      form.resetFields();
    });
  };

  const handleTypeChange = (value: 'material' | 'product' | 'other') => {
      setLossType(value);
      form.setFieldsValue({ itemId: undefined, itemName: undefined, amount: undefined });
  };

  const handleItemChange = (itemId: string) => {
      if (lossType === 'material') {
          const m = data.materials.find(m => m.id === itemId);
          if (m) {
              form.setFieldsValue({ 
                  itemName: m.name,
                  // Default amount could be unit price * quantity, but quantity is not set yet
              });
          }
      } else if (lossType === 'product') {
          const p = data.products.find(p => p.id === itemId);
          if (p) {
              form.setFieldsValue({ itemName: p.name });
          }
      }
  };

  return (
    <div>
      <Card title="损耗与额外支出管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingLoss(null);
          setLossType('material');
          form.resetFields();
          form.setFieldsValue({ date: dayjs(), type: 'material' });
          setIsModalVisible(true);
        }}>
          新增损耗记录
        </Button>
      }>
        <Table 
            columns={columns} 
            dataSource={data.losses || []} 
            rowKey="id" 
            pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal 
        title={editingLoss ? "编辑损耗" : "新增损耗"} 
        open={isModalVisible} 
        onOk={handleOk} 
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select 
                onChange={handleTypeChange}
                options={[
                    { value: 'material', label: '原料损耗 (材料报废)' },
                    { value: 'product', label: '次品报废 (生产坏件)' },
                    { value: 'other', label: '其他支出 (设备维修等)' }
                ]}
            />
          </Form.Item>

          {lossType !== 'other' && (
              <Form.Item name="itemId" label={lossType === 'material' ? "选择原料" : "选择产品"}>
                  <Select 
                    showSearch 
                    optionFilterProp="label" 
                    onChange={handleItemChange}
                    allowClear
                    options={lossType === 'material' 
                        ? data.materials.map(m => ({ value: m.id, label: `${m.name} (¥${m.price})` }))
                        : data.products.map(p => ({ value: p.id, label: `${p.name} (¥${p.price})` }))
                    }
                  />
              </Form.Item>
          )}

          {lossType === 'other' && (
              <Form.Item name="itemName" label="支出项名称" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input placeholder="例如：机器维修费" />
              </Form.Item>
          )}

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="quantity" label="数量">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item name="amount" label="总金额 (损失成本)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </Space>

          <Form.Item name="reason" label="备注说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
