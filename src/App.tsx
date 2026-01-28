import React, { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import { 
  UserOutlined, 
  ShopOutlined, 
  FormOutlined, 
  BarChartOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { useData } from './useData';
import { EmployeeManager } from './components/EmployeeManager';
import { ProductManager } from './components/ProductManager';
import { MaterialManager } from './components/MaterialManager';
import { DailyRecords } from './components/DailyRecords';
import { SalaryReport } from './components/SalaryReport';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('records');
  
  const { 
    data, loading, 
    addEmployee, updateEmployee, deleteEmployee,
    addProduct, updateProduct, deleteProduct,
    addMaterial, updateMaterial, deleteMaterial,
    addRecord, deleteRecord,
    openDataFolder
  } = useData();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    { key: 'records', icon: <FormOutlined />, label: '记账' },
    { key: 'employees', icon: <UserOutlined />, label: '员工管理' },
    { key: 'products', icon: <ShopOutlined />, label: '产品管理' },
    { key: 'materials', icon: <ShopOutlined />, label: '原料管理' },
    { key: 'reports', icon: <BarChartOutlined />, label: '工资报表' },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>正在加载数据...</div>;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'employees':
        return <EmployeeManager employees={data.employees} onAdd={addEmployee} onUpdate={updateEmployee} onDelete={deleteEmployee} />;
      case 'products':
        return <ProductManager products={data.products} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} />;
      case 'materials':
        return <MaterialManager materials={data.materials} onAdd={addMaterial} onUpdate={updateMaterial} onDelete={deleteMaterial} />;
      case 'records':
        return <DailyRecords data={data} onAdd={addRecord} onDelete={deleteRecord} />;
      case 'reports':
        return <SalaryReport data={data} />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {collapsed ? '管家' : '柯基记账'}
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={['records']} 
          mode="inline" 
          items={menuItems} 
          onClick={({ key }) => setCurrentView(key)}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', textAlign: 'center' }}>
          <div 
            style={{ 
              color: 'rgba(255, 255, 255, 0.65)', 
              cursor: 'pointer', 
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onClick={openDataFolder}
            title="点击打开数据文件夹"
          >
            <FolderOpenOutlined />
            {!collapsed && <span>数据位置</span>}
          </div>
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
                {menuItems.find(i => i.key === currentView)?.label}
            </Title>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              minHeight: 360,
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
