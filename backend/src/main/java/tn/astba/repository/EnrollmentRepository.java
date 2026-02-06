package tn.astba.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.astba.domain.Enrollment;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {

    List<Enrollment> findByStudentId(String studentId);

    List<Enrollment> findByTrainingId(String trainingId);

    Optional<Enrollment> findByStudentIdAndTrainingId(String studentId, String trainingId);

    boolean existsByStudentIdAndTrainingId(String studentId, String trainingId);
}
