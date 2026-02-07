package tn.astba.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import tn.astba.domain.Student;

import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {

    @Query("{ $or: [ " +
           "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'email': { $regex: ?0, $options: 'i' } } " +
           "] }")
    Page<Student> searchByQuery(String query, Pageable pageable);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<Student> findByEmail(String email);

    Optional<Student> findByPhone(String phone);
}
