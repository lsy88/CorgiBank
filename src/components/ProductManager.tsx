import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Product } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  products: Product[];
  onAdd: (prod: Product) => void;
  onUpdate: (prod: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductManager: React.FC<Props> = ({ products, onAdd, onUpdate, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values: { name: string; price: number }) => {
      if (editingProduct) {
        onUpdate({ ...editingProduct, ...values });
      } else {
        onAdd({ id: uuidv4(), ...values });
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { 
      title: '单价 (元)', 
      dataIndex: 'price', 
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
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
        title="产品列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加产品
          </Button>
        }
      >
        <Table dataSource={products} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editingProduct ? "编辑产品" : "添加产品"} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}>
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
