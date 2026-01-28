# <img src="./public/icon.png" width="48" style="vertical-align: bottom;" /> 记账管家 (Salary Manager)

一款基于 Electron + React + TypeScript 开发的桌面端计件工资管理系统。专为小型工厂或作坊设计，帮助管理者轻松记录员工生产情况，自动核算工资。

## ✨ 主要功能

*   **👥 员工管理**：轻松添加、修改和管理员工信息。
*   **📦 产品与原料管理**：
    *   支持产品和原料的增删改查。
    *   灵活设置不同项目的单价。
*   **📝 生产记录**：
    *   每日生产记录录入（支持产品和原料）。
    *   自动关联员工与项目，计算当日产值。
    *   **备注功能**：支持为每条记录添加备注信息。
*   **📊 工资报表**：
    *   **月度统计**：自动生成每月的员工产量和工资报表。
    *   **年度统计**：一键切换查看年度汇总数据。
*   **💾 数据安全**：
    *   数据本地持久化存储（JSON格式），无需联网，安全可靠。
    *   支持一键打开数据文件夹进行备份。
*   **🎨 现代化界面**：
    *   基于 Ant Design 的清爽 UI。
    *   大窗口设计 (1200x900)，数据展示更清晰。
    *   左侧菜单栏支持折叠。

## 🛠️ 技术栈

*   **Core**: Electron
*   **Frontend**: React, TypeScript, Vite
*   **UI Framework**: Ant Design
*   **Data Persistence**: Node.js fs (Local JSON)

## 🚀 快速开始

### 开发环境

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **启动开发模式**
    ```bash
    npm run dev
    ```

### 打包构建

构建 Windows 安装包：

```bash
npm run build
```

构建完成后，安装包位于 `release` 目录下（例如 `release/0.0.0/记账管家-Windows-0.0.0-Setup.exe`）。

## 📂 数据存储

应用数据存储在系统的用户数据目录下。
*   **查看方式**：点击应用左下角的 <img src="https://api.iconify.design/ant-design:folder-open-outlined.svg" width="16" style="vertical-align: middle;" /> **数据位置** 按钮即可直接打开数据文件夹。
*   **备份建议**：定期备份该文件夹下的 `salary-manager-data.json` 文件。

---
