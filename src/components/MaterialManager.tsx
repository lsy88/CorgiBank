import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Material } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  materials: Material[];
  onAdd: (mat: Material) => void;
  onUpdate: (mat: Material) => void;
  onDelete: (id: string) => void;
}

export const MaterialManager: React.FC<Props> = ({ materials, onAdd, onUpdate, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Material) => {
    setEditingMaterial(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values: { name: string; price: number }) => {
      if (editingMaterial) {
        onUpdate({ ...editingMaterial, ...values });
      } else {
        onAdd({ id: uuidv4(), ...values });
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '原料名称', dataIndex: 'name', key: 'name' },
    { 
      title: '单价 (元)', 
      dataIndex: 'price', 
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Material) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗?" onConfirm={() => onDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="原料列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加原料
          </Button>
        }
      >
        <Table dataSource={materials} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editingMaterial ? "编辑原料" : "添加原料"} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="原料名称" rules={[{ required: true, message: '请输入原料名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="单价 (元)" rules={[{ required: true, message: '请输入单价' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
