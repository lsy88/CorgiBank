import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Employee } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  employees: Employee[];
  onAdd: (emp: Employee) => void;
  onUpdate: (emp: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeeManager: React.FC<Props> = ({ employees, onAdd, onUpdate, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values: { name: string }) => {
      if (editingEmployee) {
        onUpdate({ ...editingEmployee, ...values });
      } else {
        onAdd({ id: uuidv4(), ...values });
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Employee) => (
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
        title="员工列表" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加员工
          </Button>
        }
      >
        <Table dataSource={employees} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingEmployee ? "编辑员工" : "添加员工"} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
