export const curriculumCypherSeed = `
// 1. XOÁ DỮ LIỆU CŨ(TUỲ CHỌN) - Nếu muốn làm sạch toàn bộ khoá học cũ
// MATCH (n:Course) DETACH DELETE n;

// --- HỌC KỲ 1 ---
MERGE (:Course:KnowledgeEntity {id: "0120001215", name: "Xác suất thống kê và xử lý số liệu thực nghiệm", credits: 3, type: "Bắt buộc", semester: 1})
MERGE (:Course:KnowledgeEntity {id: "0120080101", name: "Phương pháp nghiên cứu", credits: 3, type: "Bắt buộc", semester: 1})
MERGE (:Course:KnowledgeEntity {id: "0120080102", name: "Quản trị học", credits: 3, type: "Bắt buộc", semester: 1})
MERGE (:Course:KnowledgeEntity {id: "0120122042", name: "Nhập môn ngành công nghệ thông tin", credits: 3, type: "Bắt buộc", semester: 1})
MERGE (:Course:KnowledgeEntity {id: "0120124101", name: "Kỹ thuật lập trình", credits: 4, type: "Bắt buộc", semester: 1})

// --- HỌC KỲ 2 ---
MERGE (:Course:KnowledgeEntity {id: "0120121000", name: "Cơ sở dữ liệu", credits: 3, type: "Bắt buộc", semester: 2})
MERGE (:Course:KnowledgeEntity {id: "0120122003", name: "Lập trình hướng đối tượng", credits: 3, type: "Bắt buộc", semester: 2})
MERGE (:Course:KnowledgeEntity {id: "0120122044", name: "Cấu trúc rời rạc", credits: 4, type: "Bắt buộc", semester: 2})
MERGE (:Course:KnowledgeEntity {id: "0120123002", name: "Mạng máy tính", credits: 3, type: "Bắt buộc", semester: 2})
MERGE (:Course:KnowledgeEntity {id: "0120125000", name: "Kiến trúc máy tính", credits: 3, type: "Bắt buộc", semester: 2})

// --- HỌC KỲ 3 ---
MERGE (:Course:KnowledgeEntity {id: "0120005105", name: "Triết học Mác - Lênin", credits: 3, type: "Bắt buộc", semester: 3})
MERGE (:Course:KnowledgeEntity {id: "0120080103", name: "Tư duy thiết kế và đổi mới sáng tạo", credits: 3, type: "Bắt buộc", semester: 3})
MERGE (:Course:KnowledgeEntity {id: "0120122105", name: "Công nghệ phần mềm", credits: 3, type: "Bắt buộc", semester: 3})
MERGE (:Course:KnowledgeEntity {id: "0120124002", name: "Cấu trúc dữ liệu và giải thuật", credits: 3, type: "Bắt buộc", semester: 3})
MERGE (:Course:KnowledgeEntity {id: "0120125001", name: "Hệ điều hành", credits: 3, type: "Bắt buộc", semester: 3})

// --- HỌC KỲ 4 ---
MERGE (:Course:KnowledgeEntity {id: "0120005004", name: "Pháp luật đại cương", credits: 2, type: "Bắt buộc", semester: 4})
MERGE (:Course:KnowledgeEntity {id: "0120005106", name: "Kinh tế chính trị Mác - Lênin", credits: 2, type: "Bắt buộc", semester: 4})
MERGE (:Course:KnowledgeEntity {id: "0120121002", name: "Thiết kế cơ sở dữ liệu", credits: 3, type: "Bắt buộc", semester: 4})
MERGE (:Course:KnowledgeEntity {id: "0120121008", name: "Phân tích thiết kế hệ thống", credits: 3, type: "Bắt buộc", semester: 4})
MERGE (:Course:KnowledgeEntity {id: "0120121137", name: "Quản trị doanh nghiệp CNTT", credits: 3, type: "Bắt buộc", semester: 4})

// --- HỌC KỲ 5 ---
MERGE (:Course:KnowledgeEntity {id: "0120005107", name: "Chủ nghĩa xã hội khoa học", credits: 2, type: "Bắt buộc", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120123013", name: "Lập trình mạng", credits: 3, type: "Bắt buộc", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120123033", name: "An toàn thông tin", credits: 3, type: "Bắt buộc", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120121003", name: "Hệ quản trị cơ sở dữ liệu", credits: 3, type: "Tự chọn", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120121031", name: "Lập trình Web", credits: 3, type: "Tự chọn", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120122136", name: "Lập trình Java", credits: 3, type: "Tự chọn", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120123043", name: "Thiết kế mạng", credits: 3, type: "Tự chọn", semester: 5})
MERGE (:Course:KnowledgeEntity {id: "0120123044", name: "Mạng máy tính nâng cao", credits: 3, type: "Tự chọn", semester: 5})

// 3. THIẾT LẬP CÁC ĐƯỜNG LIÊN KẾT (EDGES) QUAN HỆ TIÊN QUYẾT (PREREQUISITE_OF)
`;

export const curriculumEdgesSeed = `
MATCH (pre:Course {id: "0120124101"}), (next:Course {id: "0120122003"}) MERGE (pre)-[:PREREQUISITE_OF]->(next); 
MATCH (pre:Course {id: "0120124101"}), (next:Course {id: "0120122044"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre:Course {id: "0120124101"}), (next:Course {id: "0120124002"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre:Course {id: "0120125000"}), (next:Course {id: "0120125001"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre:Course {id: "0120005105"}), (next:Course {id: "0120005106"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);

MATCH (pre1:Course {id: "0120121000"}), (pre2:Course {id: "0120122044"}), (pre3:Course {id: "0120124101"}), (next:Course {id: "0120121002"})
MERGE (pre1)-[:PREREQUISITE_OF]->(next) MERGE (pre2)-[:PREREQUISITE_OF]->(next) MERGE (pre3)-[:PREREQUISITE_OF]->(next);

MATCH (pre:Course {id: "0120121000"}), (next:Course {id: "0120121008"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre:Course {id: "0120005105"}), (next:Course {id: "0120005107"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);

MATCH (pre1:Course {id: "0120124101"}), (pre2:Course {id: "0120123002"}), (next:Course {id: "0120123013"})
MERGE (pre1)-[:PREREQUISITE_OF]->(next) MERGE (pre2)-[:PREREQUISITE_OF]->(next);

MATCH (pre:Course {id: "0120121000"}), (next:Course {id: "0120121003"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre1:Course {id: "0120121000"}), (pre2:Course {id: "0120124101"}), (next:Course {id: "0120121031"})
MERGE (pre1)-[:PREREQUISITE_OF]->(next) MERGE (pre2)-[:PREREQUISITE_OF]->(next);

MATCH (pre1:Course {id: "0120122003"}), (pre2:Course {id: "0120124101"}), (next:Course {id: "0120122136"})
MERGE (pre1)-[:PREREQUISITE_OF]->(next) MERGE (pre2)-[:PREREQUISITE_OF]->(next);

MATCH (pre:Course {id: "0120123002"}), (next:Course {id: "0120123043"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
MATCH (pre:Course {id: "0120123002"}), (next:Course {id: "0120123044"}) MERGE (pre)-[:PREREQUISITE_OF]->(next);
`;
