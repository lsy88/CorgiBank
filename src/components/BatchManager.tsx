import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card, DatePicker, Select, InputNumber, Divider, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, SyncOutlined, CopyOutlined } from '@ant-design/icons';
import { Batch, AppData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

interface Props {
  data: AppData;
  onAdd: (batch: Batch) => void;
  onUpdate: (batch: Batch) => void;
  onDelete: (id: string) => void;
}

export const BatchManager: React.FC<Props> = ({ data, onAdd, onUpdate, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingBatch(null);
    form.resetFields();
    form.setFieldsValue({
        date: dayjs(),
        products: [],
        materials: [],
        employees: []
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Batch) => {
    setEditingBatch(record);
    // Transform data for form if needed
    form.setFieldsValue({
        ...record,
        date: dayjs(record.date)
    });
    setIsModalVisible(true);
  };

  const handleCopy = (record: Batch) => {
    setEditingBatch(null); // Treat as new batch
    form.setFieldsValue({
        ...record,
        name: `${record.name} (复制)`,
        date: dayjs(), // Default to today
        products: record.products || [],
        materials: record.materials || [],
        employees: record.employees || []
    });
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const batchData = {
          ...values,
          date: values.date.format('YYYY-MM-DD'),
          products: values.products || [],
          materials: values.materials || [],
          employees: values.employees || []
      };

      if (editingBatch) {
        onUpdate({ ...editingBatch, ...batchData });
      } else {
        onAdd({ id: uuidv4(), ...batchData });
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '批次名称', dataIndex: 'name', key: 'name' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
        title: '产品', 
        key: 'products',
        render: (_: any, record: Batch) => (
            <span>{record.products?.length || 0} 项</span>
        )
    },
    { 
        title: '参与员工', 
        key: 'employees',
        render: (_: any, record: Batch) => (
            <span>{record.employees?.length || 0} 人</span>
        )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Batch) => (
        <Space size="middle">
          <Tooltip title="复制此批次">
            <Button icon={<CopyOutlined />} onClick={() => handleCopy(record)} />
          </Tooltip>
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
        title="批次管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建批次
          </Button>
        }
      >
        <Table dataSource={data.batches} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal 
        title={editingBatch ? "编辑批次" : "新建批次"} 
        open={isModalVisible} 
        onOk={handleOk} 
        onCancel={() => setIsModalVisible(false)}
        width={900}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="name" label="批次名称" rules={[{ required: true, message: '请输入名称' }]} style={{ flex: 1 }}>
                <Input placeholder="例如: 2024-01-29 生产" />
            </Form.Item>
            <Form.Item name="date" label="日期" rules={[{ required: true }]} style={{ width: 200 }}>
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          
          <Divider titlePlacement="left">包含产品 (产出)</Divider>
          <Row gutter={16} style={{ marginBottom: 8, fontWeight: 'bold' }}>
              <Col span={8}>产品名称</Col>
              <Col span={6}>数量</Col>
              <Col span={6}>单价 (元)</Col>
              <Col span={4}>操作</Col>
          </Row>
          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="选择产品" onChange={(val) => {
                              const p = data.products.find(x => x.id === val);
                              if(p) {
                                  const products = form.getFieldValue('products');
                                  if (products && products[name]) {
                                    products[name].snapshotPrice = p.price;
                                    form.setFieldsValue({ products });
                                  }
                              }
                          }} options={data.products.map(p => ({ label: p.name, value: p.id }))} />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="数量" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'snapshotPrice']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                           <InputNumber placeholder="单价" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item shouldUpdate={(prev, curr) => prev.products !== curr.products} noStyle>
                            {({ getFieldValue, setFieldsValue }) => {
                                const products = getFieldValue('products') || [];
                                const currentItem = products[name];
                                if (!currentItem) return null;
                                
                                const product = data.products.find(p => p.id === currentItem.productId);
                                if (!product) return null;
                                
                                const isDiff = Math.abs((currentItem.snapshotPrice || 0) - product.price) > 0.001;
                                
                                return (
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: 2, display: 'flex', alignItems: 'center' }}>
                                        <span>标准: ¥{product.price}</span>
                                        {isDiff && (
                                            <Tooltip title="点击使用标准单价">
                                                <SyncOutlined 
                                                    style={{ marginLeft: 6, color: '#1890ff', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const newProducts = [...products];
                                                        newProducts[name].snapshotPrice = product.price;
                                                        setFieldsValue({ products: newProducts });
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                );
                            }}
                        </Form.Item>
                    </Col>
                    <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: '18px', color: '#ff4d4f', cursor: 'pointer' }} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加产品
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider titlePlacement="left">使用原料 (消耗)</Divider>
          <Row gutter={16} style={{ marginBottom: 8, fontWeight: 'bold' }}>
              <Col span={8}>原料名称</Col>
              <Col span={6}>数量</Col>
              <Col span={6}>成本 (元)</Col>
              <Col span={4}>操作</Col>
          </Row>
          <Form.List name="materials">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'materialId']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="选择原料" onChange={(val) => {
                               const m = data.materials.find(x => x.id === val);
                               if(m) {
                                   const materials = form.getFieldValue('materials');
                                   if (materials && materials[name]) {
                                     materials[name].snapshotPrice = m.price;
                                     form.setFieldsValue({ materials });
                                   }
                               }
                          }} options={data.materials.map(m => ({ label: m.name, value: m.id }))} />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber placeholder="数量" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            {...restField}
                            name={[name, 'snapshotPrice']}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber placeholder="成本" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item shouldUpdate={(prev, curr) => prev.materials !== curr.materials} noStyle>
                            {({ getFieldValue, setFieldsValue }) => {
                                const materials = getFieldValue('materials') || [];
                                const currentItem = materials[name];
                                if (!currentItem) return null;
                                
                                const material = data.materials.find(m => m.id === currentItem.materialId);
                                if (!material) return null;
                                
                                const isDiff = Math.abs((currentItem.snapshotPrice || 0) - material.price) > 0.001;
                                
                                return (
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: 2, display: 'flex', alignItems: 'center' }}>
                                        <span>标准: ¥{material.price}</span>
                                        {isDiff && (
                                            <Tooltip title="点击使用标准成本">
                                                <SyncOutlined 
                                                    style={{ marginLeft: 6, color: '#1890ff', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const newMaterials = [...materials];
                                                        newMaterials[name].snapshotPrice = material.price;
                                                        setFieldsValue({ materials: newMaterials });
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                );
                            }}
                        </Form.Item>
                    </Col>
                    <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: '18px', color: '#ff4d4f', cursor: 'pointer' }} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加原料
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider titlePlacement="left">参与员工</Divider>
          <Row gutter={16} style={{ marginBottom: 8, fontWeight: 'bold' }}>
              <Col span={10}>员工姓名</Col>
              <Col span={8}>分成份数 (默认1份)</Col>
              <Col span={6}>操作</Col>
          </Row>
          <Form.List name="employees">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                    <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'employeeId']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="选择员工" options={data.employees.map(e => ({ label: e.name, value: e.id }))} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'share']}
                          initialValue={1}
                          rules={[{ required: true }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={6} style={{ display: 'flex', alignItems: 'center' }}>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: '18px', color: '#ff4d4f', cursor: 'pointer' }} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加员工
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

        </Form>
      </Modal>
    </div>
  );
};