# CN466-final-API

---

## Table of contents

- [CN466-final-API](#cn466-final-api)
  - [Table of contents](#table-of-contents)
  - [About](#about)
  - [Motivation](#motivation)
  - [Requirement](#requirement)
  - [Design](#design)
  - [API](#api)
    - [Postman document](#postman-document)
    - [หน้าที่](#หน้าที่)
    - [Design](#design-1)
    - [การทำงาน](#การทำงาน)
  - [Demo](#demo)
    - [Link](#link)

---

## About

โปรเจคนี้เป็นส่วนหนึ่งของวิชา CN466 อินเทอร์เน็ตของสรรพสิ่ง โดยเป็นระบบที่ใช้ Board CucumberS เพื่อรับข้อมูลความชื้น, แรงดัน, อุณหภูมิ เเละนำข้อมูลที่บอร์ดสามารถเก็บได้มาใช้งานเพื่อทำ Application ขึ้นมาโดยมีการใช้ Cloud, Line Chatbot, TensorflowJS เเละอุปกรณ์อื่นๆทับกันเป็น Stack

This repository is created for CN466's Internet of Things Project. By using board cucumberS (ESP32S2) to collect data and Cloud, Line Chatbot, TensorflowJS and another tools to make an application stack.

Developed by: Poonnatuch B.

---

## Motivation

เนื่องจากในปัจจุบัน ผู้คนสนใจการปลูกต้นไม้เป็นงานอดิเรกมากขึ้นโดยเฉพาะไม้กระถางเล็กๆ ผมอยากที่จะสร้างระบบที่สามารถตั้งเวลาการรดน้ำได้ตามที่เราต้องการเเละมีการเเจ้งเตือนกลับมาที่ผู้ใช้งาน สามารถที่จะคาดเดาได้จากข้อมูลต่างๆว่าควรหรือไม่ควรรดน้ำ ซึ่งจะอำนวยความสะดวกให้กับผู้ใช้งานได้อย่างมาก

---

## Requirement

1. __CucumberS__ ใช้สำหรับเก็บข้อมูลอุณหภูมิ, ความชื้น, ความดัน ของกระถางต้นไม้โดยจะ Publish ข้อมูลผ่าน HiveMQ เเละ Subscribe ข้อมูลที่ topic หนึ่งเพื่อสั่งงานจาก Remote server ได้
2. __HiveMQ__ ใช้สำหรับรับข้อมูลจากบอร์ดและส่งข้อมูลหรือคำสั่งไปให้บอร์ดทำงาน เป็นตัวเชื่อมระหว่างบอร์ดเเละโลกภายนอก
3. __Linebot__ ใช้สำหรับส่งข้อมูลเพื่อคุยหรือใช้งานบอร์ดเเละ Service อื่นๆ
4. __LIFF__ ใช้สำหรับทำงานอื่นๆที่ Chat อย่างเดียวจะทำให้ทำงานลำบากเช่นการกรอกฟอร์มเพื่อสั่งงานหรือใช้งาน Service ต่างๆเช่นการจัดตารางรดน้พเป็นต้น
5. __Web API__ ใช้สอง api คือ Geolocation เเละ Camera รายละเอียดจะอธิบายในหน้า README ที่รับผิดชอบงานนี้
6. __TensorflowJS__ ใช้เพื่อ Classify รูปท้องฟ้าที่ผู้ใช้ส่งเข้ามาว่าท้องฟ้ามีเเสงมาก, น้อย, มืด เพื่อ predict ว่าควรหรือไม่ที่จะรดน้ำต้นไม้
7. __Cloud server__ ใช้ Heroku เพื่อ deploy code, MongoDB สำหรับฐานข้อมูล, HiveMQ สำหรับ mqtt protocal เพื่อติดต่อกับบอร์ด

---

## Design

---

## API

### [Postman document](https://documenter.getpostman.com/view/17798233/UVRAHmww)

### หน้าที่

API (repository นี้) ทำหน้าที่เป็น End point เเละ Service หลักให้กับ Application ทั้งหมด เช่นการดึงข้อมูลล่าสุดจากบอร์ด, การจัดตาราง(Schedule)การรดน้ำ, การดึงข้อมูลพยากรณ์อากาศ เป็นต้น

### Design

### การทำงาน

---

## Demo

### [Link]()